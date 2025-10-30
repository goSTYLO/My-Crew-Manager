// services/UserModel.ts

export interface User {
    email: string;
    password: string;
  }
  
  export interface ValidationResult {
    isValid: boolean;
    errors: { [key: string]: string };
  }
  
  export class UserModel {
    static validateUser(user: User): ValidationResult {
      const errors: { [key: string]: string } = {};
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
      if (!user.email) errors.email = 'Email is required';
      else if (!emailRegex.test(user.email)) errors.email = 'Enter a valid email address';
  
      if (!user.password) errors.password = 'Password is required';
      else if (user.password.length < 6) errors.password = 'Password must be at least 6 characters long';
  
      return { isValid: Object.keys(errors).length === 0, errors };
    }
  }