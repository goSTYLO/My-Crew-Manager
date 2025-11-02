"""
Request logging middleware to track all incoming HTTP requests.
This helps diagnose connection issues, especially from mobile apps.
"""
import logging
import time

logger = logging.getLogger('django.request')


class RequestLoggingMiddleware:
    """
    Middleware to log all HTTP requests with details useful for debugging.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Get client IP
        client_ip = self._get_client_ip(request)
        
        # Log request details
        start_time = time.time()
        logger.info(
            f'📥 INCOMING REQUEST:\n'
            f'   Method: {request.method}\n'
            f'   Path: {request.path}\n'
            f'   Full URL: {request.get_full_path()}\n'
            f'   Client IP: {client_ip}\n'
            f'   User-Agent: {request.META.get("HTTP_USER_AGENT", "Unknown")}\n'
            f'   Content-Type: {request.META.get("CONTENT_TYPE", "N/A")}\n'
            f'   Headers: {dict(request.headers)}'
        )
        
        # Process request
        response = self.get_response(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log response details
        logger.info(
            f'📤 RESPONSE:\n'
            f'   Status: {response.status_code}\n'
            f'   Path: {request.path}\n'
            f'   Duration: {duration:.3f}s\n'
            f'   Client IP: {client_ip}'
        )
        
        return response
    
    def _get_client_ip(self, request):
        """Extract client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'Unknown')
        return ip

