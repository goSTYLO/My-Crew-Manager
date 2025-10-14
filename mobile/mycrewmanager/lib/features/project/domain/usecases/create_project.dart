import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/features/project/domain/entities/project.dart';
import 'package:mycrewmanager/features/project/domain/repository/project_repository.dart';

class CreateProject {
  final ProjectRepository repository;

  CreateProject(this.repository);

  Future<Either<Failure, Project>> call({
    required String title,
    required String summary,
  }) async {
    return await repository.createProject(
      title: title,
      summary: summary,
    );
  }
}

