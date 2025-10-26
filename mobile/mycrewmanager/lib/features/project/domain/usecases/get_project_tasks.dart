import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:mycrewmanager/features/project/domain/entities/task.dart';
import 'package:mycrewmanager/features/project/domain/repository/project_repository.dart';

class GetProjectTasks implements UseCase<List<ProjectTask>, GetProjectTasksParams> {
  final ProjectRepository projectRepository;

  GetProjectTasks(this.projectRepository);

  @override
  Future<Either<Failure, List<ProjectTask>>> call(GetProjectTasksParams params) async {
    return await projectRepository.getProjectTasks(params.projectId);
  }
}

class GetProjectTasksParams {
  final int projectId;

  GetProjectTasksParams({required this.projectId});
}
