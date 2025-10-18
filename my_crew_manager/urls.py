from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

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
    path('api/user/', include('users.urls')),
    path('api/project-management/', include('project_management.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/ai/', include('ai_api.urls')),
]
