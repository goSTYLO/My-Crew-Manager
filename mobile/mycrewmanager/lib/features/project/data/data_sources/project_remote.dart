import 'package:dio/dio.dart';
import 'package:mycrewmanager/features/project/data/models/project_model.dart';
import 'package:mycrewmanager/features/project/data/models/member_model.dart';
import 'package:mycrewmanager/features/project/data/models/task_model.dart';

class ProjectRemoteDataSource {
  final Dio dio;

  ProjectRemoteDataSource(this.dio);

  Future<List<ProjectModel>> getProjects() async {
    final response = await dio.get('ai/projects/');
    final List<dynamic> data = response.data;
    return data.map((json) => ProjectModel.fromJson(json)).toList();
  }

  Future<ProjectModel> getProject(int id) async {
    final response = await dio.get('ai/projects/$id/');
    return ProjectModel.fromJson(response.data);
  }

  Future<ProjectModel> createProject(Map<String, dynamic> body) async {
    final response = await dio.post('ai/projects/', data: body);
    return ProjectModel.fromJson(response.data);
  }

  Future<ProjectModel> updateProject(int id, Map<String, dynamic> body) async {
    final response = await dio.put('ai/projects/$id/', data: body);
    return ProjectModel.fromJson(response.data);
  }

  Future<void> deleteProject(int id) async {
    await dio.delete('ai/projects/$id/');
  }

  Future<Map<String, dynamic>> getProjectBacklog(int id) async {
    final response = await dio.get('ai/projects/$id/backlog/');
    return response.data;
  }

  Future<List<MemberModel>> getProjectMembers(int projectId) async {
    final response = await dio.get('ai/project-members/?project_id=$projectId');
    final List<dynamic> data = response.data;
    return data.map((json) => MemberModel.fromJson(json)).toList();
  }

  Future<List<TaskModel>> getProjectTasks(int projectId) async {
    // Get tasks from the project's backlog
    final response = await dio.get('ai/projects/$projectId/backlog/');
    final Map<String, dynamic> data = response.data;
    
    List<TaskModel> tasks = [];
    if (data['epics'] != null) {
      for (var epic in data['epics']) {
        if (epic['sub_epics'] != null) {
          for (var subEpic in epic['sub_epics']) {
            if (subEpic['user_stories'] != null) {
              for (var userStory in subEpic['user_stories']) {
                if (userStory['tasks'] != null) {
                  for (var task in userStory['tasks']) {
                    tasks.add(TaskModel.fromJson(task));
                  }
                }
              }
            }
          }
        }
      }
    }
    return tasks;
  }

  Future<MemberModel> createMember({
    required String name,
    required String role,
    required String email,
    required int projectId,
  }) async {
    try {
      // Create a new project member - backend will check if user exists and handle permissions
      final response = await dio.post('ai/project-members/', data: {
        'project': projectId,
        'user_name': name,
        'user_email': email,
        'role': role,
      });
      return MemberModel.fromJson(response.data);
    } catch (e) {
      // Handle specific error messages from the backend
      if (e.toString().contains('unique set') || e.toString().contains('already a member')) {
        throw Exception('This user is already a member of this project');
      } else if (e.toString().contains('Only the project creator can add members')) {
        throw Exception('Only the project creator can add members');
      } else if (e.toString().contains('Project not found')) {
        throw Exception('Project not found');
      }
      rethrow;
    }
  }

  Future<void> deleteMember(int id) async {
    try {
      await dio.delete('ai/project-members/$id/');
    } catch (e) {
      // Handle specific error messages from the backend
      if (e.toString().contains('Only the project creator can remove members')) {
        throw Exception('Only the project creator can remove members');
      } else if (e.toString().contains('Member not found')) {
        throw Exception('Member not found');
      }
      rethrow;
    }
  }
}

