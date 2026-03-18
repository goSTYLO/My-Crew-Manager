// Ensure API_BASE_URL always includes /api
// Node backend default: 8001. Django (legacy): 8000. Set VITE_API_BASE_URL to switch.
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
const API_BASE_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
export { API_BASE_URL };
