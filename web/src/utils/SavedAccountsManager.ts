// utils/SavedAccountsManager.ts

// Simple encryption/decryption utilities
const encryptPassword = (password: string): string => {
    return btoa(encodeURIComponent(password).split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ (i % 256))
    ).join(''));
  };
  
  const decryptPassword = (encrypted: string): string => {
    try {
      const decoded = atob(encrypted);
      return decodeURIComponent(decoded.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ (i % 256))
      ).join(''));
    } catch {
      return '';
    }
  };
  
  // Saved account interface
  export interface SavedAccount {
    email: string;
    lastUsed: number;
    rememberMe: boolean;
    encryptedPassword?: string;
  }
  
  // Manage saved accounts in localStorage
  export class SavedAccountsManager {
    private static STORAGE_KEY = 'saved_accounts';
  
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
  
      if (rememberMe) {
        newAccount.encryptedPassword = encryptPassword(password);
        console.log("🔐 Password encrypted and saved for:", email);
      } else {
        console.log("📧 Only email saved (no password) for:", email);
      }
  
      if (existingIndex >= 0) {
        accounts[existingIndex] = newAccount;
      } else {
        accounts.push(newAccount);
      }
  
      accounts.sort((a, b) => b.lastUsed - a.lastUsed);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(accounts));
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
  
    static decryptPassword(encrypted: string): string {
      return decryptPassword(encrypted);
    }
  }