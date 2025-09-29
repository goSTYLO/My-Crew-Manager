from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse


def home(request):
    return HttpResponse('Home Page')

def room(request):
    return HttpResponse('ROOM')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/user/', include('users.urls')),
    path('api/project-management/', include('project_management.urls')),
]
