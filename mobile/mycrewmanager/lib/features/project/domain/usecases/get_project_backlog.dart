import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/features/project/domain/repository/project_repository.dart';
import 'package:mycrewmanager/features/project/domain/entities/backlog.dart';

class GetProjectBacklog {
  final ProjectRepository repository;

  GetProjectBacklog(this.repository);

  Future<Either<Failure, Backlog>> call(int projectId) async {
    return await repository.getProjectBacklog(projectId);
  }
}

