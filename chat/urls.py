"""
Hybrid Chat System: REST API for data operations + WebSocket for real-time updates
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import RoomViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')

urlpatterns = [
    path('', include(router.urls)),
    # Manual nested routes for messages under rooms
    path('rooms/<int:room_pk>/messages/', MessageViewSet.as_view({'get': 'list', 'post': 'create'}), name='room-messages-list-create'),
    path('rooms/<int:room_pk>/messages/<int:pk>/', MessageViewSet.as_view({'delete': 'destroy'}), name='room-message-detail'),
]


