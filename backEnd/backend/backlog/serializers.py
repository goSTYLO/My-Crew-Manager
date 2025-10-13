from rest_framework import serializers
from backlog.models import Backlog, Epic, SubEpic, UserStory, Task

# 🔹 BACKLOG
class BacklogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Backlog
        fields = ["id", "project", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

# 🔹 EPIC
class EpicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Epic
        fields = ["id", "backlog", "title", "description", "ai", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

# 🔹 SUB-EPIC
class SubEpicSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubEpic
        fields = ["id", "epic", "title", "description", "ai", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

# 🔹 USER STORY
class UserStorySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStory
        fields = [
            "id", "sub_epic", "title", "description", "acceptance_criteria",
            "ai", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

# 🔹 TASK
class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["id", "story", "goal", "title", "ai", "created_at"]
        read_only_fields = ["id", "created_at"]