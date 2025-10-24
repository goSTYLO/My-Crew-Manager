import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/features/project/domain/entities/project.dart';
import 'package:mycrewmanager/features/project/domain/repository/project_repository.dart';

class GetMyProjects {
  final ProjectRepository repository;

  GetMyProjects(this.repository);

  Future<Either<Failure, List<Project>>> call() async {
    return await repository.getMyProjects();
  }
}
