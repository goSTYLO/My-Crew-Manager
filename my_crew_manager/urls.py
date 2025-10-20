from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static


def home(request):
    return HttpResponse('Home Page')

def room(request):
    return HttpResponse('ROOM')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/user/', include('users.urls')),
    path('api/project-management/', include('project_management.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/ai/', include('ai_api.urls')),
]

# Serve media files in development - MUST BE OUTSIDE THE LIST
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)