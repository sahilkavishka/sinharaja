from django.urls import path
from .views import get_scene

urlpatterns = [
    # උදා: /api/scene/1/
    path('scene/<int:scene_id>/', get_scene),
]