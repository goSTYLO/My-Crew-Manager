// utils/CookieManager.ts
// Note: HTTP-only cookies set by the backend cannot be accessed by JavaScript
// This utility provides helper functions for cookie operations that are possible from the frontend

export class CookieManager {
  /**
   * Get a cookie value by name
   * Note: This will NOT work for HTTP-only cookies set by the backend
   * @param name Cookie name
   * @returns Cookie value or null
   */
  static getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    
    return null;
  }

  /**
   * Set a cookie (for non-HTTP-only cookies only)
   * Note: HTTP-only cookies are set by the backend
   * @param name Cookie name
   * @param value Cookie value
   * @param days Number of days until expiration
   */
  static setCookie(name: string, value: string, days: number = 30): void {
    if (typeof document === 'undefined') return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  /**
   * Delete a cookie
   * @param name Cookie name
   */
  static deleteCookie(name: string): void {
    if (typeof document === 'undefined') return;
    
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  /**
   * Check if cookies are enabled in the browser
   * @returns True if cookies are enabled
   */
  static areCookiesEnabled(): boolean {
    if (typeof document === 'undefined') return false;
    
    try {
      document.cookie = 'testcookie=1';
      const enabled = document.cookie.indexOf('testcookie=') !== -1;
      document.cookie = 'testcookie=1; expires=Thu, 01-Jan-1970 00:00:01 GMT';
      return enabled;
    } catch {
      return false;
    }
  }
}
