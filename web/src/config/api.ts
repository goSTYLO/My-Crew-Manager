// Ensure API_BASE_URL always includes /api
// Node backend default: 8001. Django (legacy): 8000. Set VITE_API_BASE_URL to switch.
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
const API_BASE_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

function resolveProfilePictureUrl(raw?: string | null): string | null {
	if (!raw) return null;
	if (/^https?:\/\//i.test(raw)) return raw;

	const normalized = String(raw).replace(/\\/g, '/');
	if (normalized.startsWith('/api/media/')) return `${API_ORIGIN}${normalized.replace(/^\/api/, '')}`;
	if (normalized.startsWith('/media/')) return `${API_ORIGIN}${normalized}`;
	if (normalized.startsWith('media/')) return `${API_ORIGIN}/${normalized}`;

	return `${API_ORIGIN}/media/${normalized.replace(/^\/+/, '')}`;
}

export { API_BASE_URL, API_ORIGIN, resolveProfilePictureUrl };
