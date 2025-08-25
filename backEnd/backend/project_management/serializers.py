from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    owner_id = serializers.ReadOnlyField(source="owner.id")
    owner_username = serializers.ReadOnlyField(source="owner.username")  
    owner_email = serializers.ReadOnlyField(source="owner.email")       

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "status",
            "start_date",
            "end_date",
            "owner_id",
            "owner_username",
            "owner_email"
        ]
        read_only_fields = ["id", "owner_id", "owner_username", "owner_email"]
