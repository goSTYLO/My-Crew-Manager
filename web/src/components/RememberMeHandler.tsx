import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginController } from '../services/LoginController';
import { TokenManager } from '../services/TokenManager';

const AUTH_PATHS = ['/signin', '/sign-in', '/signup', '/signUp', '/', '/landing-page'];

const RememberMeHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
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
        if (session && session.email.toLowerCase() === normalizedCurrentEmail) {
          TokenManager.clearAll();
          window.location.replace('/sign-in');
        }
      } else if (eventType === 'session_started' && session) {
        const normalizedSessionEmail = session.email.toLowerCase().trim();
        if (normalizedSessionEmail === normalizedCurrentEmail) {
          const currentSessionId = TokenManager.getCurrentSessionIdPublic();
          if (session.sessionId !== currentSessionId) {
            TokenManager.clearAll();
            window.location.replace('/sign-in');
          }
        }
      }
    };

    window.addEventListener('session-change', handleSessionChange as EventListener);
    return () => {
      window.removeEventListener('session-change', handleSessionChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (AUTH_PATHS.includes(location.pathname)) {
      setIsChecking(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (TokenManager.isAuthenticated()) {
        const activeSession = TokenManager.getActiveSession();
        const currentSessionId = TokenManager.getCurrentSessionIdPublic();
        const currentEmail = TokenManager.getEmail();

        if (currentEmail && activeSession) {
          const normalizedCurrent = currentEmail.toLowerCase().trim();
          const normalizedActive = activeSession.email.toLowerCase().trim();
          if (normalizedActive === normalizedCurrent && activeSession.sessionId !== currentSessionId) {
            TokenManager.clearAll();
            navigate('/sign-in', { replace: true });
          }
        }
        if (!cancelled) setIsChecking(false);
        return;
      }

      try {
        const result = await LoginController.checkRememberMeSession();
        if (
          !cancelled &&
          result.authenticated &&
          result.user &&
          (location.pathname === '/' || location.pathname === '/landing-page')
        ) {
          const role = TokenManager.getUserRole() || '';
          const normalizedRole = role.trim().replace(/\s+/g, ' ').toLowerCase();
          const redirectPath =
            normalizedRole.includes('project') && normalizedRole.includes('manager')
              ? '/main-projects'
              : '/projects-user';
          navigate(redirectPath, { replace: true });
        }
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  if (isChecking) {
    return null;
  }

  return <>{children}</>;
};

export default RememberMeHandler;
