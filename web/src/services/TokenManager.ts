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
 * - Prevents concurrent logins from multiple tabs
 */
export class TokenManager {
  private static readonly TOKEN_KEY = 'token';
  private static readonly ACCESS_KEY = 'access'; // Legacy support
  private static readonly REFRESH_KEY = 'refresh'; // Only for JWT
  private static readonly USER_ROLE_KEY = 'userRole';
  private static readonly USERNAME_KEY = 'username';
  private static readonly EMAIL_KEY = 'email';
  
  // Session management keys (localStorage - shared across tabs)
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
   * Check if there's an active session for a different tab
   */
  static hasActiveSessionInOtherTab(email: string): boolean {
    try {
      const activeSessionStr = localStorage.getItem(this.ACTIVE_SESSION_KEY);
      if (!activeSessionStr) {
        return false;
      }

      const activeSession: ActiveSession = JSON.parse(activeSessionStr);
      const currentSessionId = this.getCurrentSessionId();

      // If session exists and is not from this tab, return true
      if (activeSession.email === email && activeSession.sessionId !== currentSessionId) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking active session:', error);
      return false;
    }
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
        console.log('ℹ️ Different account in active session - valid in multi-account mode');
        return true; // Allow different accounts to coexist
      }

      // KEY CHECK: If session ID doesn't match, this tab was opened by URL copying (invalid)
      // Only the original tab (with matching session ID) should remain logged in
      if (activeSession.sessionId !== currentSessionId) {
        console.warn('⚠️ Session ID mismatch - tab was opened from copied URL, logging out this tab only');
        return false;
      }

      // Session ID matches - this is the original tab, keep it logged in
      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }

  /**
   * Register active session (prevents concurrent logins for SAME account only)
   * In multi-account mode, different accounts can coexist
   * When force=true (during login), it will overwrite existing session even if different account
   */
  static registerActiveSession(email: string, force = false): void {
    const normalizedEmail = email.toLowerCase().trim();
    const sessionId = this.getCurrentSessionId();
    
    // Check if there's already an active session
    const existingSession = this.getActiveSession();
    
    if (existingSession) {
      if (existingSession.email === normalizedEmail) {
        // Active session exists for this SAME email
        if (existingSession.sessionId === sessionId) {
          // This tab already has the active session - just update timestamp
          const updatedSession: ActiveSession = {
            ...existingSession,
            timestamp: Date.now(),
          };
          localStorage.setItem(this.ACTIVE_SESSION_KEY, JSON.stringify(updatedSession));
          console.log('🔐 Active session timestamp updated for:', email);
          return;
        } else {
          // Active session exists for same email but from a different tab
          // Prevent concurrent login for same account - LoginController should have blocked this already
          console.warn('⚠️ Cannot register session - account already logged in from another tab:', email);
          throw new Error('Account is already logged in from another browser tab');
        }
      } else {
        // Active session exists for a DIFFERENT email (multi-account mode)
        if (force) {
          // During login (force=true), we can overwrite existing session (different account login)
          // This is OK in multi-account mode - the other account's tab will stay logged in
          // because RememberMeHandler checks for different emails and doesn't log out
          console.log('🔐 Different account logging in - overwriting active_session (other account stays logged in via multi-account mode)');
          // The old session will be replaced, triggering session_started event for the new account
          // Tabs with the old account will check in RememberMeHandler and NOT log out (different email)
        } else {
          // Not forcing - in multi-account mode, we can't register (active_session already taken by different account)
          // This is OK - the tab can still work, it just won't have active_session set
          // RememberMeHandler will allow it to continue since it has a token
          console.log('ℹ️ Cannot register active session - different account is already active (multi-account mode, continuing anyway)');
          // Don't throw error - allow the tab to continue without active_session registration
          // The tab will still work because it has a token and RememberMeHandler allows multi-account mode
          return; // Exit without registering, but don't throw error
        }
      }
    }
    
    // Register new active session (either no existing session, or force=true)
    const activeSession: ActiveSession = {
      email: normalizedEmail,
      sessionId: sessionId,
      timestamp: Date.now(),
    };

    localStorage.setItem(this.ACTIVE_SESSION_KEY, JSON.stringify(activeSession));
    
    // Broadcast session change to other tabs
    // Other tabs will check if same account and log out if needed
    // Different account tabs will stay logged in (multi-account mode)
    this.broadcastSessionChange('session_started', activeSession);
    
    console.log('🔐 Active session registered for:', email);
  }

  /**
   * Clear active session (on logout)
   * Only clears if this tab is the owner of the active session
   * This prevents copied tabs from clearing the original tab's session
   */
  static clearActiveSession(): void {
    const currentSession = this.getActiveSession();
    const currentSessionId = this.getCurrentSessionId();
    
    // Only clear active session if this tab owns it (prevents copied tabs from clearing original)
    if (currentSession && currentSession.sessionId === currentSessionId) {
      localStorage.removeItem(this.ACTIVE_SESSION_KEY);
      this.broadcastSessionChange('session_ended', currentSession);
      console.log('🔐 Active session cleared (by owner tab)');
    } else {
      // This tab doesn't own the session, just clear local session storage
      console.log('🔐 Clearing local session (this tab does not own active session)');
    }
    
    // Always clear this tab's session ID
    sessionStorage.removeItem(this.SESSION_ID_KEY);
  }

  /**
   * Get current active session info
   */
  static getActiveSession(): ActiveSession | null {
    try {
      const activeSessionStr = localStorage.getItem(this.ACTIVE_SESSION_KEY);
      if (!activeSessionStr) {
        return null;
      }
      return JSON.parse(activeSessionStr);
    } catch (error) {
      console.error('Error getting active session:', error);
      return null;
    }
  }

  /**
   * Broadcast session change to other tabs via StorageEvent
   */
  private static broadcastSessionChange(eventType: 'session_started' | 'session_ended', session: ActiveSession): void {
    // StorageEvent is automatically fired when localStorage changes
    // But we can also dispatch a custom event for more control
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
    
    // Register active session if email provided
    if (email) {
      try {
        this.registerActiveSession(email, forceRegister);
      } catch (error) {
        // If registration fails for SAME account (concurrent session), clear the token
        // But if it's a different account, we already handle it silently in registerActiveSession
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('already logged in from another browser tab')) {
          // Same account concurrent session - this is an error, clear and throw
          console.error('Failed to register session (same account conflict):', error);
          this.clearAll();
          throw error; // Re-throw to let caller handle
        } else {
          // Different account or other issue - log but don't clear (multi-account mode)
          console.log('ℹ️ Could not register active session (different account active) - continuing anyway (multi-account mode)');
          // Token is still stored, tab can continue working
        }
      }
    }
    
    console.log('🔐 Token stored securely');
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
    console.log('🔐 All authentication data cleared');
  }

  /**
   * Get token with automatic refresh if needed
   * This prevents race conditions by reusing ongoing refresh attempts
   */
  static async getValidToken(): Promise<string | null> {
    const token = this.getToken();
    
    if (!token) {
      console.log('⚠️ No token found, attempting to refresh...');
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
      console.log('⏳ Refresh already in progress, waiting...');
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
            localStorage.setItem(this.ACTIVE_SESSION_KEY, JSON.stringify(updatedSession));
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
        
        console.log('✅ Token refreshed successfully');
        return result.token;
      } else {
        console.warn('⚠️ Token refresh failed:', result.message);
        this.clearAll();
        return null;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
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
      // Unauthorized - token might be expired
      console.log('🔄 401 Unauthorized, attempting token refresh...');
      const newToken = await this.refreshTokenIfNeeded();
      return !!newToken; // Return true if refresh succeeded
    }
    return false;
  }
}

