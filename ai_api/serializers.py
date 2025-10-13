from rest_framework import serializers
from .models import Project, Proposal


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'title', 'summary', 'created_by', 'created_at']
        read_only_fields = ['id', 'created_at', 'created_by']


class ProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = ['id', 'project', 'file', 'parsed_text', 'uploaded_by', 'uploaded_at']
        read_only_fields = ['id', 'parsed_text', 'uploaded_by', 'uploaded_at']


