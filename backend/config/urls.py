from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static

# Customize the default admin site
admin.site.site_header = "My Crew Manager Administration"
admin.site.site_title = "My Crew Manager Admin"
admin.site.index_title = "Welcome to My Crew Manager Administration"

def home(request):
    return HttpResponse('Home Page')

def room(request):
    return HttpResponse('ROOM')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/user/', include('backend.apps.users.urls')),
    path('api/chat/', include('backend.apps.chat.urls')),
    path('api/ai/', include('backend.apps.ai_api.urls')),
]

# Serve media and static files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)