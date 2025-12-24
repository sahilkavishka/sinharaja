from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Scene
from .serializers import SceneSerializer

@api_view(['GET'])
def get_scene(request, scene_id):
    try:
        # ID එකට අදාළ Scene එක හොයනවා
        scene = Scene.objects.get(id=scene_id)
        # ඒක JSON බවට හරවනවා
        serializer = SceneSerializer(scene)
        return Response(serializer.data)
    except Scene.DoesNotExist:
        return Response({"error": "Scene not found"}, status=404)