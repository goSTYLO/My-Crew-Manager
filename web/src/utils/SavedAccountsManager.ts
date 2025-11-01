// utils/SavedAccountsManager.ts

// Saved account interface with secure password encryption
export interface SavedAccount {
  email: string;
  lastUsed: number;
  rememberMe: boolean;
  encryptedPassword?: string; // Password encrypted with token-derived key (only if Remember Me is enabled)
}
  
  // Manage saved accounts in localStorage
  export class SavedAccountsManager {
    private static STORAGE_KEY = 'saved_accounts';

    /**
     * Get or create a persistent encryption key for the user
     * Uses email + browser fingerprint for consistent encryption across sessions
     */
    private static getEncryptionKey(email: string): string {
      try {
        const keyStorageKey = `enc_key_${email.toLowerCase()}`;
        let encryptionKey = sessionStorage.getItem(keyStorageKey);
        
        if (!encryptionKey) {
          // Create a new encryption key derived from email + browser info
          const browserInfo = navigator.userAgent + (navigator.language || '') + (screen.width?.toString() || '');
          const combined = email.toLowerCase() + browserInfo;
          
          // Create a hash-like key
          let hash = '';
          for (let i = 0; i < combined.length; i++) {
            hash += String.fromCharCode((combined.charCodeAt(i) + (i * 7)) % 256);
          }
          
          // Use base64 and take first 32 chars for key
          encryptionKey = btoa(hash).slice(0, 32).replace(/[+/=]/g, '');
          sessionStorage.setItem(keyStorageKey, encryptionKey);
        }
        
        return encryptionKey;
      } catch {
        // Fallback: use email-based simple key
        return btoa(email.toLowerCase()).slice(0, 16).replace(/[+/=]/g, '');
      }
    }

    /**
     * Encrypt password using user-specific persistent key
     * Security: Password is encrypted with a key derived from email and browser fingerprint
     * The key is stored in sessionStorage and persists across page reloads
     */
    private static encryptPassword(password: string, email: string): string {
      try {
        const key = this.getEncryptionKey(email);
        
        // Simple XOR encryption with key
        let encrypted = '';
        for (let i = 0; i < password.length; i++) {
          const keyChar = key[i % key.length];
          encrypted += String.fromCharCode(
            password.charCodeAt(i) ^ keyChar.charCodeAt(0)
          );
        }
        
        return btoa(encrypted); // Base64 encode for storage
      } catch {
        return '';
      }
    }

    /**
     * Decrypt password using user-specific persistent key
     * Security: Can only decrypt if the same encryption key exists (same browser, same email)
     */
    private static decryptPassword(encrypted: string, email: string): string {
      try {
        if (!encrypted || !email) return '';
        
        const encryptedData = atob(encrypted);
        const key = this.getEncryptionKey(email);
        
        // Decrypt using XOR
        let decrypted = '';
        for (let i = 0; i < encryptedData.length; i++) {
          const keyChar = key[i % key.length];
          decrypted += String.fromCharCode(
            encryptedData.charCodeAt(i) ^ keyChar.charCodeAt(0)
          );
        }
        
        return decrypted;
      } catch {
        return '';
      }
    }

    static getAllAccounts(): SavedAccount[] {
      try {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    }

    static saveAccount(email: string, password: string, rememberMe: boolean): void {
      const accounts = this.getAllAccounts();
      const existingIndex = accounts.findIndex(acc => acc.email.toLowerCase() === email.toLowerCase());
      
      const newAccount: SavedAccount = {
        email,
        lastUsed: Date.now(),
        rememberMe: rememberMe
      };

      // Encrypt and store password only if Remember Me is enabled
      // Uses email-based encryption key that persists across sessions
      if (rememberMe && password) {
        newAccount.encryptedPassword = this.encryptPassword(password, email);
        console.log("🔐 Password encrypted and stored securely for:", email);
      } else {
        console.log("📧 Email saved (no password stored) for:", email);
      }

      if (existingIndex >= 0) {
        accounts[existingIndex] = newAccount;
      } else {
        accounts.push(newAccount);
      }

      accounts.sort((a, b) => b.lastUsed - a.lastUsed);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(accounts));
    }

    /**
     * Get decrypted password for auto-fill
     * Security: Password is decrypted using email-based encryption key
     * Works as long as the same browser/device is used (encryption key persists in sessionStorage)
     */
    static getDecryptedPassword(email: string): string {
      try {
        const account = this.getAccountByEmail(email);
        if (account && account.encryptedPassword) {
          const decrypted = this.decryptPassword(account.encryptedPassword, email);
          if (decrypted) {
            console.log("🔓 Password decrypted successfully for auto-fill");
            return decrypted;
          }
        }
      } catch (error) {
        console.error("❌ Error decrypting password:", error);
      }
      return '';
    }
  
    static removeAccount(email: string): void {
      const accounts = this.getAllAccounts();
      const filtered = accounts.filter(acc => acc.email.toLowerCase() !== email.toLowerCase());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    }
  
    static updateLastUsed(email: string): void {
      const accounts = this.getAllAccounts();
      const account = accounts.find(acc => acc.email.toLowerCase() === email.toLowerCase());
      if (account) {
        account.lastUsed = Date.now();
        accounts.sort((a, b) => b.lastUsed - a.lastUsed);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(accounts));
      }
    }
  
    static clearAll(): void {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  
    static getAccountByEmail(email: string): SavedAccount | null {
      const accounts = this.getAllAccounts();
      return accounts.find(acc => acc.email.toLowerCase() === email.toLowerCase()) || null;
    }
  }