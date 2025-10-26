import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:mycrewmanager/features/project/domain/entities/project.dart';
import 'package:mycrewmanager/features/project/domain/repository/project_repository.dart';

class UpdateProject implements UseCase<Project, UpdateProjectParams> {
  final ProjectRepository projectRepository;

  UpdateProject(this.projectRepository);

  @override
  Future<Either<Failure, Project>> call(UpdateProjectParams params) async {
    return await projectRepository.updateProject(
      id: params.id,
      title: params.title,
      summary: params.summary,
    );
  }
}

class UpdateProjectParams {
  final int id;
  final String title;
  final String summary;

  UpdateProjectParams({
    required this.id,
    required this.title,
    required this.summary,
  });
}
