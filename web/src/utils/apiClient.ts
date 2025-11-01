// utils/apiClient.ts
// Secure API client with automatic token refresh and expiration handling

import { API_BASE_URL } from '../config/api';
import { TokenManager } from '../services/TokenManager';

interface ApiClientOptions extends RequestInit {
  skipAuth?: boolean; // Skip adding auth token
  retryOn401?: boolean; // Automatically retry on 401 after token refresh
}

/**
 * Secure API client that:
 * - Automatically adds authentication token
 * - Handles token expiration and refresh
 * - Provides consistent error handling
 */
export async function apiClient(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<Response> {
  const { skipAuth = false, retryOn401 = true, ...fetchOptions } = options;

  // Get valid token
  let token = await TokenManager.getValidToken();
  
  if (!token && !skipAuth) {
    throw new Error('No authentication token available. Please log in.');
  }

  // Build headers
  const headers = new Headers(fetchOptions.headers);
  if (!skipAuth && token) {
    headers.set('Authorization', `Token ${token}`);
  }
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Make request
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  let response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 Unauthorized - token might be expired
  if (response.status === 401 && retryOn401 && !skipAuth) {
    console.log('🔄 401 Unauthorized, attempting token refresh...');
    const refreshSucceeded = await TokenManager.handleApiError(401);
    
    if (refreshSucceeded) {
      // Get new token and retry request
      token = await TokenManager.getValidToken();
      if (token) {
        headers.set('Authorization', `Token ${token}`);
        console.log('🔄 Retrying request with refreshed token...');
        response = await fetch(url, {
          ...fetchOptions,
          headers,
        });
      }
    } else {
      // Refresh failed, user needs to re-authenticate
      console.error('❌ Token refresh failed, user needs to re-authenticate');
      // Dispatch event for components to handle logout
      window.dispatchEvent(new CustomEvent('auth:token-expired'));
    }
  }

  return response;
}

/**
 * JSON API client that automatically parses JSON responses
 */
export async function apiClientJson<T = any>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const response = await apiClient(endpoint, options);
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage;
    } catch {
      // Response is not JSON, use status text
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    throw new Error('Invalid JSON response from server');
  }
}

