import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginController } from '../services/LoginController';
import { TokenManager } from '../services/TokenManager';

interface ActiveSession {
  email: string;
  sessionId: string;
  timestamp: number;
}

// Component to handle Remember Me session check and session synchronization
const RememberMeHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  // Listen for session changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only listen for active_session changes (ignore other localStorage changes)
      if (e.key !== 'active_session') {
        return;
      }
      
      const currentEmail = TokenManager.getEmail();
      
      if (!currentEmail || !TokenManager.isAuthenticated()) {
        // Not logged in, no action needed
        return;
      }
      
      const normalizedCurrentEmail = currentEmail.toLowerCase().trim();
      
      // Get the NEW value from the storage event (what was just set)
      let newActiveSession: ActiveSession | null = null;
      try {
        if (e.newValue) {
          newActiveSession = JSON.parse(e.newValue);
        }
      } catch (err) {
        console.error('Error parsing new active session:', err);
        return;
      }
      
      // If new session is null, it means active_session was cleared
      if (!newActiveSession) {
        // Session was cleared - don't auto-logout (might be different account login or actual logout)
        // Only logout on explicit session_ended event for same account
        console.log('ℹ️ Active session cleared - not auto-logging out (might be different account login)');
        return;
      }
      
      // New session exists - check if it's for the same or different account
      const normalizedNewEmail = newActiveSession.email.toLowerCase().trim();
      
      if (normalizedNewEmail === normalizedCurrentEmail) {
        // SAME ACCOUNT - check if it's from this tab or another tab
        const currentSessionId = TokenManager.getCurrentSessionIdPublic();
        if (newActiveSession.sessionId !== currentSessionId) {
          // Same account but different sessionId means another tab logged in
          // This shouldn't happen (LoginController should block it), but if it does, log out
          console.warn('⚠️ Same account logged in from another tab (unexpected), logging out this tab...');
          TokenManager.clearAll();
          window.location.replace('/sign-in');
        }
        // Same sessionId means it's this tab - continue (no action needed)
      } else {
        // DIFFERENT ACCOUNT - explicitly stay logged in (multi-account mode)
        console.log('✅ Different account logged in from another tab - staying logged in (multi-account mode)');
        // DO NOT logout - allow multiple accounts simultaneously
        // This is the key fix: different accounts can coexist
      }
    };

    // Listen for custom session-change events
    const handleSessionChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const currentEmail = TokenManager.getEmail();
      
      if (!currentEmail || !TokenManager.isAuthenticated()) {
        return;
      }
      
      const normalizedCurrentEmail = currentEmail.toLowerCase().trim();
      const eventType = customEvent.detail?.eventType;
      const session = customEvent.detail?.session as { email: string; sessionId?: string } | undefined;
      
      if (eventType === 'session_ended') {
        // Session ended - only log out if it was for the current user
        if (session && session.email.toLowerCase() === normalizedCurrentEmail) {
          console.warn('⚠️ Session ended in another tab (same account), logging out this tab...');
          TokenManager.clearAll();
          window.location.replace('/sign-in');
        } else {
          console.log('ℹ️ Different account logged out - staying logged in');
        }
      } else if (eventType === 'session_started') {
        // New session started - check if it's same or different account
        if (session) {
          const normalizedSessionEmail = session.email.toLowerCase().trim();
          
          if (normalizedSessionEmail === normalizedCurrentEmail) {
            // Same account - should not happen (LoginController should block it)
            const currentSessionId = TokenManager.getCurrentSessionIdPublic();
            if (session.sessionId !== currentSessionId) {
              // Same account but different sessionId - unexpected, log out
              console.warn('⚠️ Same account logged in from another tab (unexpected), logging out this tab...');
              TokenManager.clearAll();
              window.location.replace('/sign-in');
            }
            // Same sessionId means it's this tab - continue
          } else {
            // Different account logged in - stay logged in (multi-account mode)
            console.log('ℹ️ Different account logged in from another tab - staying logged in (multi-account mode)');
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('session-change', handleSessionChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('session-change', handleSessionChange as EventListener);
    };
  }, []);

  // Validate current session on mount AND on route changes
  useEffect(() => {
    const validateSession = () => {
      // Skip if already on login/signup pages
      const isAuthPage = ['/signin', '/sign-in', '/signup', '/signUp', '/', '/landing-page'].includes(location.pathname);
      
        if (!isAuthPage) {
        // Only validate if we have a token (protected route access)
        if (TokenManager.isAuthenticated()) {
          const activeSession = TokenManager.getActiveSession();
          const currentSessionId = TokenManager.getCurrentSessionIdPublic();
          const currentEmail = TokenManager.getEmail();
          
          // CRITICAL: If we have a token and email, we're authenticated for this tab
          // The active_session in localStorage is ONLY a hint for SAME-account conflict detection
          // Different accounts can ALWAYS coexist - we never log out based on active_session for different accounts
          
          if (currentEmail) {
            const normalizedCurrentEmail = currentEmail.toLowerCase().trim();
            
            if (activeSession) {
              const normalizedActiveEmail = activeSession.email.toLowerCase().trim();
              
              // If active session is for a DIFFERENT account, stay logged in (multi-account mode)
              // This is the key: different accounts can coexist, active_session only tracks ONE of them
              if (normalizedActiveEmail !== normalizedCurrentEmail) {
                console.log('✅ Different account in active session - staying logged in (multi-account mode)');
                console.log(`   Active session: ${normalizedActiveEmail}, Current tab: ${normalizedCurrentEmail}`);
                // DO NOT logout - different accounts can coexist
                // DO NOT try to register - let each account maintain its own state
                // active_session is informational only for multi-account mode
                setIsChecking(false);
                return; // Continue - allow multiple accounts
              }
              
              // Same account - check session ID (only validate same-account scenarios)
              if (normalizedActiveEmail === normalizedCurrentEmail) {
                if (activeSession.sessionId !== currentSessionId) {
                  // Same account but different sessionId - this tab was opened from a copied URL
                  console.warn('⚠️ This tab was opened from a copied URL - logging out this tab only (original tab remains logged in)');
                  TokenManager.clearAll();
                  navigate('/sign-in', { replace: true });
                  setIsChecking(false);
                  return;
                }
                // Same account and same sessionId - this is the original tab, keep it
                setIsChecking(false);
                return;
              }
            }
            
            // No active session OR active session is for different account (already handled above)
            // This tab has a token and email - it's valid and can continue
            // In multi-account mode, not every tab needs to have active_session
            console.log('ℹ️ Valid session (token + email) - continuing (multi-account mode allows this)');
            setIsChecking(false);
            return;
          }
          
          // Has token but no email - might be Remember Me, let it continue
          console.log('ℹ️ Has token but no email - might be Remember Me, continuing...');
        }
        
        // If no token, but we're on a protected route, check Remember Me
        // (This handles Remember Me restoration without active session)
      }
    };

    // Validate immediately
    validateSession();

    // Also check for Remember Me session on initial mount only
    const isAuthPage = ['/signin', '/sign-in', '/signup', '/signUp', '/', '/landing-page'].includes(location.pathname);
    
    if (!isAuthPage && isChecking) {
      // Check for Remember Me session only on initial mount
      LoginController.checkRememberMeSession()
        .then((result) => {
          if (result.authenticated && result.user) {
            // User has valid Remember Me session - determine redirect based on role
            const role = TokenManager.getUserRole() || '';
            const normalizedRole = role.trim().replace(/\s+/g, ' ').toLowerCase();
            
            let redirectPath = '/projects-user'; // Default
            if (normalizedRole.includes('project') && normalizedRole.includes('manager')) {
              redirectPath = '/main-projects';
            }
            
            // Only redirect if we're at root or landing page
            if (location.pathname === '/' || location.pathname === '/landing-page') {
              console.log('✅ Remember Me session restored, redirecting to:', redirectPath);
              navigate(redirectPath, { replace: true });
            }
          }
        })
        .catch((error) => {
          console.error('❌ Error checking Remember Me session:', error);
        })
        .finally(() => {
          setIsChecking(false);
        });
    } else {
      setIsChecking(false);
    }
  }, [location.pathname, navigate, isChecking]); // Run on route changes

  if (isChecking) {
    // Optional: Show loading spinner while checking
    return null; // Or return a loading component
  }

  return <>{children}</>;
};

export default RememberMeHandler;

