import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:mycrewmanager/features/project/domain/entities/task.dart';
import 'package:mycrewmanager/features/project/domain/repository/project_repository.dart';
import 'package:fpdart/fpdart.dart';

class UpdateTaskStatus implements UseCase<ProjectTask, UpdateTaskStatusParams> {
  final ProjectRepository projectRepository;

  UpdateTaskStatus(this.projectRepository);

  @override
  Future<Either<Failure, ProjectTask>> call(UpdateTaskStatusParams params) async {
    return await projectRepository.updateTaskStatus(params.taskId, params.status, commitTitle: params.commitTitle);
  }
}

class UpdateTaskStatusParams {
  final int taskId;
  final String status;
  final String? commitTitle;

  UpdateTaskStatusParams({
    required this.taskId,
    required this.status,
    this.commitTitle,
  });
}
