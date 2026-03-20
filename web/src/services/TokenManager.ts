// services/TokenManager.ts
// Centralized, secure token management service

import { LoginController } from './LoginController';

interface TokenData {
  token: string;
  expiresAt?: number; // Unix timestamp in milliseconds
  refreshToken?: string; // Only if using JWT (not DRF Token)
}

interface ActiveSession {
  email: string;
  sessionId: string;
  timestamp: number;
}

/**
 * Secure token storage and management service
 * - Centralizes token storage logic
 * - Handles token expiration
 * - Prevents race conditions in token refresh
 * - Provides secure token access
 */
export class TokenManager {
  private static readonly TOKEN_KEY = 'token';
  private static readonly ACCESS_KEY = 'access'; // Legacy support
  private static readonly REFRESH_KEY = 'refresh'; // Only for JWT
  private static readonly USER_ROLE_KEY = 'userRole';
  private static readonly USERNAME_KEY = 'username';
  private static readonly EMAIL_KEY = 'email';
  
  // Session management keys (sessionStorage - per-tab, no cross-tab sync)
  static readonly ACTIVE_SESSION_KEY = 'active_session';
  static readonly SESSION_ID_KEY = 'current_session_id';

  // Prevent multiple simultaneous refresh attempts
  private static refreshPromise: Promise<string | null> | null = null;
  private static lastRefreshAttempt = 0;
  private static readonly REFRESH_COOLDOWN = 5000; // 5 seconds cooldown between refresh attempts

  /**
   * Generate unique session ID for this tab
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get current session ID for this tab
   */
  private static getCurrentSessionId(): string {
    let sessionId = sessionStorage.getItem(this.SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem(this.SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  }

  /**
   * Get current session ID (public method for validation)
   */
  static getCurrentSessionIdPublic(): string {
    return this.getCurrentSessionId();
  }

  /**
   * Check if there's an active session for a different tab.
   * With sessionStorage (per-tab), we can never see another tab's data - always returns false.
   */
  static hasActiveSessionInOtherTab(_email: string): boolean {
    return false;
  }

  /**
   * Validate if current tab's session is still valid
   * Returns true if session is valid for this tab, false otherwise
   * This specifically checks if the tab was opened from a copied URL (different session ID)
   */
  static isCurrentTabSessionValid(): boolean {
    try {
      // If no token, session is invalid
      if (!this.isAuthenticated()) {
        return false;
      }

      const activeSession = this.getActiveSession();
      const currentEmail = this.getEmail();
      const currentSessionId = this.getCurrentSessionId();

      // If no active session exists, allow this tab to work (might be first tab or Remember Me)
      // Only invalidate if there's an active session that doesn't match
      if (!activeSession) {
        // No active session means no other tab is logged in, so this tab is valid
        return true;
      }

      // If we have email but it doesn't match active session, this is a different account
      // This is valid in multi-account mode - different accounts can be logged in simultaneously
      if (currentEmail && activeSession.email.toLowerCase() !== currentEmail.toLowerCase()) {
        return true; // Allow different accounts to coexist
      }

      // KEY CHECK: If session ID doesn't match, this tab was opened by URL copying (invalid)
      // Only the original tab (with matching session ID) should remain logged in
      if (activeSession.sessionId !== currentSessionId) {
        return false;
      }

      // Session ID matches - this is the original tab, keep it logged in
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Register active session for this tab (sessionStorage - per-tab only).
   * With sessionStorage, no cross-tab coordination; each tab manages its own session.
   */
  static registerActiveSession(email: string, _force = false): void {
    const normalizedEmail = email.toLowerCase().trim();
    const sessionId = this.getCurrentSessionId();
    const existingSession = this.getActiveSession();

    if (existingSession && existingSession.email === normalizedEmail && existingSession.sessionId === sessionId) {
      // This tab already has the active session - just update timestamp
      const updatedSession: ActiveSession = {
        ...existingSession,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(this.ACTIVE_SESSION_KEY, JSON.stringify(updatedSession));
      return;
    }

    const activeSession: ActiveSession = {
      email: normalizedEmail,
      sessionId,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(this.ACTIVE_SESSION_KEY, JSON.stringify(activeSession));
    this.broadcastSessionChange('session_started', activeSession);
  }

  /**
   * Clear active session (on logout).
   * Clears active_session from sessionStorage (per-tab).
   */
  static clearActiveSession(): void {
    const currentSession = this.getActiveSession();
    if (currentSession) {
      this.broadcastSessionChange('session_ended', currentSession);
    }
    sessionStorage.removeItem(this.ACTIVE_SESSION_KEY);
    sessionStorage.removeItem(this.SESSION_ID_KEY);
  }

  /**
   * Get current active session info (from sessionStorage, per-tab).
   */
  static getActiveSession(): ActiveSession | null {
    try {
      const activeSessionStr = sessionStorage.getItem(this.ACTIVE_SESSION_KEY);
      if (!activeSessionStr) {
        return null;
      }
      return JSON.parse(activeSessionStr);
    } catch {
      return null;
    }
  }

  /**
   * Broadcast session change via custom event (same-tab only; sessionStorage is per-tab).
   */
  private static broadcastSessionChange(eventType: 'session_started' | 'session_ended', session: ActiveSession): void {
    window.dispatchEvent(new CustomEvent('session-change', {
      detail: { eventType, session }
    }));
  }

  /**
   * Store authentication token securely
   * Note: sessionStorage is still used (XSS risk exists but is mitigated by:
   * - HttpOnly cookies for refresh tokens
   * - Token expiration
   * - CSP headers (if configured on server)
   * @param token - The authentication token
   * @param email - User email to register session
   * @param forceRegister - Force session registration even if session exists (for login only, not Remember Me)
   */
  static setToken(token: string, email?: string, forceRegister = false): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    // Keep legacy 'access' key for backward compatibility during migration
    sessionStorage.setItem(this.ACCESS_KEY, token);
    
    // Register active session if email provided (sessionStorage, per-tab)
    if (email) {
      this.registerActiveSession(email, forceRegister);
    }
  }

  /**
   * Get current access token
   * Returns null if token doesn't exist or is expired
   */
  static getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.ACCESS_KEY);
  }

  /**
   * Check if token exists
   */
  static hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Clear all authentication data
   */
  static clearAll(): void {
    this.clearActiveSession();
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.ACCESS_KEY);
    sessionStorage.removeItem(this.REFRESH_KEY);
    sessionStorage.removeItem(this.USER_ROLE_KEY);
    sessionStorage.removeItem(this.USERNAME_KEY);
    sessionStorage.removeItem(this.EMAIL_KEY);
  }

  /**
   * Get token with automatic refresh if needed
   * This prevents race conditions by reusing ongoing refresh attempts
   */
  static async getValidToken(): Promise<string | null> {
    const token = this.getToken();
    
    if (!token) {
      return await this.refreshTokenIfNeeded();
    }

    // For DRF tokens, we can't check expiration client-side
    // But we can attempt refresh if API call fails
    return token;
  }

  /**
   * Refresh access token using refresh token from HTTP-only cookie
   * Implements cooldown and prevents race conditions
   */
  static async refreshTokenIfNeeded(): Promise<string | null> {
    const now = Date.now();
    
    // Prevent too frequent refresh attempts
    if (this.refreshPromise && (now - this.lastRefreshAttempt) < this.REFRESH_COOLDOWN) {
      return await this.refreshPromise;
    }

    this.lastRefreshAttempt = now;
    
    // Reuse existing refresh promise if available
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    // Create new refresh promise
    this.refreshPromise = this.performRefresh();

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      // Clear promise after a delay to allow reuse
      setTimeout(() => {
        this.refreshPromise = null;
      }, this.REFRESH_COOLDOWN);
    }
  }

  /**
   * Perform the actual token refresh
   */
  private static async performRefresh(): Promise<string | null> {
    try {
      const result = await LoginController.refreshAccessToken();
      
      if (result.success && result.token) {
        // Get email from result or existing session
        const email = result.user?.email || this.getEmail();
        // Don't force register on refresh - only update if session exists for this tab
        if (email) {
          const existingSession = this.getActiveSession();
          const currentSessionId = this.getCurrentSessionId();
          // Only maintain session if it exists and is from this tab
          if (existingSession && existingSession.email === email.toLowerCase() && existingSession.sessionId === currentSessionId) {
            // Update token and maintain session timestamp
            sessionStorage.setItem(this.TOKEN_KEY, result.token);
            sessionStorage.setItem(this.ACCESS_KEY, result.token);
            const updatedSession: ActiveSession = {
              ...existingSession,
              timestamp: Date.now(),
            };
            sessionStorage.setItem(this.ACTIVE_SESSION_KEY, JSON.stringify(updatedSession));
          } else {
            // Just store token without registering session (remember me refresh from different tab)
            sessionStorage.setItem(this.TOKEN_KEY, result.token);
            sessionStorage.setItem(this.ACCESS_KEY, result.token);
            // Don't register session - this prevents Remember Me from creating new sessions
          }
        } else {
          sessionStorage.setItem(this.TOKEN_KEY, result.token);
          sessionStorage.setItem(this.ACCESS_KEY, result.token);
        }
        
        // Update user data if provided
        if (result.user) {
          this.setUserData({
            role: result.user.role,
            name: result.user.name,
            email: result.user.email,
          });
        }

        return result.token;
      } else {
        const msg = (result.message || '').toLowerCase();
        if (!msg.includes('no refresh token') || !this.getToken()) {
          this.clearAll();
        }
        return null;
      }
    } catch {
      this.clearAll();
      return null;
    }
  }

  /**
   * Store user data after login
   */
  static setUserData(userData: {
    role?: string;
    name?: string;
    email?: string;
  }): void {
    if (userData.role) {
      const normalizedRole = String(userData.role).trim().replace(/\s+/g, ' ');
      sessionStorage.setItem(this.USER_ROLE_KEY, normalizedRole);
    }
    if (userData.name) {
      sessionStorage.setItem(this.USERNAME_KEY, userData.name);
    }
    if (userData.email) {
      sessionStorage.setItem(this.EMAIL_KEY, userData.email);
    }
  }

  /**
   * Get user role
   */
  static getUserRole(): string | null {
    return sessionStorage.getItem(this.USER_ROLE_KEY);
  }

  /**
   * Get username
   */
  static getUsername(): string | null {
    return sessionStorage.getItem(this.USERNAME_KEY);
  }

  /**
   * Get email
   */
  static getEmail(): string | null {
    return sessionStorage.getItem(this.EMAIL_KEY);
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  static isAuthenticated(): boolean {
    return this.hasToken();
  }

  /**
   * Handle API error and refresh token if needed
   * Returns true if token was refreshed and request should be retried
   */
  static async handleApiError(status: number): Promise<boolean> {
    if (status === 401) {
      const newToken = await this.refreshTokenIfNeeded();
      return !!newToken; // Return true if refresh succeeded
    }
    return false;
  }
}

