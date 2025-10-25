import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/features/project/domain/entities/project.dart';
import 'package:mycrewmanager/features/project/domain/entities/member.dart';
import 'package:mycrewmanager/features/project/domain/entities/task.dart';
import 'package:mycrewmanager/features/project/domain/entities/activity.dart';
import 'package:mycrewmanager/features/project/domain/entities/backlog.dart';

abstract class ProjectRepository {
  Future<Either<Failure, List<Project>>> getProjects();
  Future<Either<Failure, List<Project>>> getMyProjects();
  Future<Either<Failure, Project>> getProject(int id);
  Future<Either<Failure, Project>> createProject({
    required String title,
    required String summary,
  });
  Future<Either<Failure, Project>> updateProject({
    required int id,
    required String title,
    required String summary,
  });
  Future<Either<Failure, void>> deleteProject(int id);
  Future<Either<Failure, Backlog>> getProjectBacklog(int id);
  Future<Either<Failure, Map<String, dynamic>>> uploadProposal({
    required String filePath,
    required int projectId,
  });
  Future<Either<Failure, Map<String, dynamic>>> ingestProposal({
    required int projectId,
    required int proposalId,
    String? title,
  });
  Future<Either<Failure, Map<String, dynamic>>> generateBacklog({
    required int projectId,
  });
  
  // Member management
  Future<Either<Failure, List<Member>>> getProjectMembers(int projectId);
  Future<Either<Failure, Member>> createMember({
    required String name,
    required String role,
    required String email,
    required int projectId,
  });
  Future<Either<Failure, void>> deleteMember(int id);
  
  // Task management
  Future<Either<Failure, List<ProjectTask>>> getProjectTasks(int projectId);
  Future<Either<Failure, List<ProjectTask>>> getUserAssignedTasks();
  Future<Either<Failure, List<Activity>>> getRecentCompletedTasks();
  Future<Either<Failure, ProjectTask>> updateTaskStatus(int taskId, String status, {String? commitTitle});
}

