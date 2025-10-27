import logging
from django.utils.deprecation import MiddlewareMixin
from django.contrib.admin.views.decorators import staff_member_required
from django.utils import timezone

# Configure logging
logger = logging.getLogger('admin_activity')

class AdminLoggingMiddleware(MiddlewareMixin):
    """Middleware to log admin activities"""
    
    def process_request(self, request):
        if request.path.startswith('/admin/'):
            # Log admin page access
            if request.user.is_authenticated and request.user.is_staff:
                logger.info(f"Admin access: {request.user.email} accessed {request.path} at {timezone.now()}")
            return None
    
    def process_response(self, request, response):
        if request.path.startswith('/admin/'):
            # Log admin actions
            if request.user.is_authenticated and request.user.is_staff:
                if request.method == 'POST':
                    logger.info(f"Admin action: {request.user.email} performed POST to {request.path} at {timezone.now()}")
                elif request.method == 'GET':
                    logger.info(f"Admin view: {request.user.email} viewed {request.path} at {timezone.now()}")
        return response
