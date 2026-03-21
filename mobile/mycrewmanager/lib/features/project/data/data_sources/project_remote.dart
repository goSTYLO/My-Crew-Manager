import 'package:dio/dio.dart';
import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:mycrewmanager/core/tokenhandlers/token_storage.dart';
import 'package:mycrewmanager/features/project/data/models/project_model.dart';
import 'package:mycrewmanager/features/project/data/models/member_model.dart';
import 'package:mycrewmanager/features/project/data/models/task_model.dart';
import 'package:mycrewmanager/features/project/data/models/activity_model.dart';

class ProjectRemoteDataSource {
  final Dio dio;
  final TokenStorage tokenStorage;

  ProjectRemoteDataSource(this.dio, this.tokenStorage);

  Future<Options> _authOptions() async {
    final token = await tokenStorage.getToken();
    final headers = <String, dynamic>{};
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Token $token';
    }
    return Options(headers: headers);
  }

  Future<Response<dynamic>> _get(String path, {Map<String, dynamic>? queryParameters}) async {
    final uri = Uri.parse(dio.options.baseUrl).resolve(path).toString();
    logger.d('Projects API GET -> $uri');
    final response = await dio.get(
      path,
      queryParameters: queryParameters,
      options: await _authOptions(),
    );
    logger.d('Projects API GET <- ${response.statusCode} $uri');
    return response;
  }

  Future<Response<dynamic>> _post(String path, {dynamic data}) async {
    final uri = Uri.parse(dio.options.baseUrl).resolve(path).toString();
    logger.d('Projects API POST -> $uri');
    final response = await dio.post(
      path,
      data: data,
      options: await _authOptions(),
    );
    logger.d('Projects API POST <- ${response.statusCode} $uri');
    return response;
  }

  Future<Response<dynamic>> _put(String path, {dynamic data}) async {
    final uri = Uri.parse(dio.options.baseUrl).resolve(path).toString();
    logger.d('Projects API PUT -> $uri');
    final response = await dio.put(
      path,
      data: data,
      options: await _authOptions(),
    );
    logger.d('Projects API PUT <- ${response.statusCode} $uri');
    return response;
  }

  Future<Response<dynamic>> _patch(String path, {dynamic data}) async {
    final uri = Uri.parse(dio.options.baseUrl).resolve(path).toString();
    logger.d('Projects API PATCH -> $uri');
    final response = await dio.patch(
      path,
      data: data,
      options: await _authOptions(),
    );
    logger.d('Projects API PATCH <- ${response.statusCode} $uri');
    return response;
  }

  Future<Response<dynamic>> _delete(String path) async {
    final uri = Uri.parse(dio.options.baseUrl).resolve(path).toString();
    logger.d('Projects API DELETE -> $uri');
    final response = await dio.delete(
      path,
      options: await _authOptions(),
    );
    logger.d('Projects API DELETE <- ${response.statusCode} $uri');
    return response;
  }

  Future<List<ProjectModel>> getProjects() async {
    final response = await _get('ai/projects/');
    final List<dynamic> data = response.data;
    return data.map((json) => ProjectModel.fromJson(json)).toList();
  }

  Future<List<ProjectModel>> getMyProjects() async {
    final response = await _get('ai/projects/my-projects/');
    final List<dynamic> data = response.data;
    return data.map((json) => ProjectModel.fromJson(json)).toList();
  }

  Future<ProjectModel> getProject(int id) async {
    final response = await _get('ai/projects/$id/');
    return ProjectModel.fromJson(response.data);
  }

  Future<ProjectModel> createProject(Map<String, dynamic> body) async {
    final response = await _post('ai/projects/', data: body);
    return ProjectModel.fromJson(response.data);
  }

  Future<ProjectModel> updateProject(int id, Map<String, dynamic> body) async {
    final response = await _put('ai/projects/$id/', data: body);
    return ProjectModel.fromJson(response.data);
  }

  Future<void> deleteProject(int id) async {
    await _delete('ai/projects/$id/');
  }

  Future<Map<String, dynamic>> getProjectBacklog(int id) async {
    final response = await _get('ai/projects/$id/backlog/');
    return response.data;
  }

  Future<List<MemberModel>> getProjectMembers(int projectId) async {
    final response = await _get('ai/project-members/', queryParameters: {'project_id': projectId});
    final List<dynamic> data = response.data;
    return data.map((json) => MemberModel.fromJson(json)).toList();
  }

  Future<List<TaskModel>> getProjectTasks(int projectId) async {
    // Get tasks from the project's backlog
    final response = await _get('ai/projects/$projectId/backlog/');
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

  Future<List<TaskModel>> getUserAssignedTasks() async {
    // Get all tasks assigned to the current user
    final response = await _get('ai/story-tasks/user-assigned/');
    final Map<String, dynamic> data = response.data;
    
    List<TaskModel> tasks = [];
    if (data['tasks'] != null) {
      for (var taskData in data['tasks']) {
        tasks.add(TaskModel.fromJson(taskData));
      }
    }
    return tasks;
  }

  Future<List<ActivityModel>> getRecentCompletedTasks() async {
    final response = await _get('ai/story-tasks/recent-completed/');
    final Map<String, dynamic> data = response.data;
    List<ActivityModel> activities = [];
    if (data['activities'] != null) {
      for (var activityData in data['activities']) {
        activities.add(ActivityModel.fromJson(activityData));
      }
    }
    return activities;
  }

  // === AI API integrations ===
  Future<Map<String, dynamic>> uploadProposal({
    required int projectId,
    required String filePath,
  }) async {
    final formData = FormData.fromMap({
      'project_id': projectId,
      'file': await MultipartFile.fromFile(filePath, filename: filePath.split('/').last),
    });
    final response = await _post('ai/proposals/', data: formData);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> ingestProposal({
    required int projectId,
    required int proposalId,
    String? titleOverride,
  }) async {
    final path = 'ai/projects/$projectId/ingest-proposal/$proposalId/';
    final response = await _put(path, data: {
      if (titleOverride != null) 'title': titleOverride,
    });
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> generateBacklog(int projectId) async {
    final response = await _put('ai/projects/$projectId/generate-backlog/');
    return response.data as Map<String, dynamic>;
  }

  Future<TaskModel> updateTaskStatus(int taskId, String status, {String? commitTitle}) async {
    try {
      
      // Prepare request data
      Map<String, dynamic> requestData = {'status': status};
      
      // Add commit_title if status is 'done' (required by backend)
      if (status == 'done') {
        requestData['commit_title'] = commitTitle ?? 'Task completed';
      }
      
      final response = await _patch('ai/story-tasks/$taskId/', data: requestData);
      return TaskModel.fromJson(response.data);
    } catch (e) {
      if (e is DioException) {
      }
      rethrow;
    }
  }

  Future<int> bulkAssignTasks(List<Map<String, dynamic>> assignments) async {
    final response = await _post('ai/story-tasks/bulk-assign/', data: {
      'assignments': assignments,
    });
    final data = response.data as Map<String, dynamic>;
    return (data['updated'] as num?)?.toInt() ?? 0;
  }

  Future<List<String>> getProjectRoles(int projectId) async {
    final response = await _get('ai/project-roles/', queryParameters: {'project_id': projectId});
    final List<dynamic> data = response.data;
    return data.map((e) => (e['role'] ?? '').toString()).where((s) => s.isNotEmpty).toList();
  }

  Future<void> patchProject({
    required int projectId,
    String? title,
    String? summary,
  }) async {
    await _patch('ai/projects/$projectId/', data: {
      if (title != null) 'title': title,
      if (summary != null) 'summary': summary,
    });
  }

  Future<Map<String, dynamic>> addProjectMember({
    required int projectId,
    required String email,
    required String role,
  }) async {
    final response = await _post('ai/project-members/', data: {
      'project': projectId,
      'user_email': email,
      'role': role,
    });
    return response.data as Map<String, dynamic>;
  }

  Future<MemberModel> createMember({
    required String name,
    required String role,
    required String email,
    required int projectId,
  }) async {
    try {
      // Create a new project member - backend will check if user exists and handle permissions
      final response = await _post('ai/project-members/', data: {
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
      await _delete('ai/project-members/$id/');
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

