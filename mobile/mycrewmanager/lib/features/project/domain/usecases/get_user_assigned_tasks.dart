import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:mycrewmanager/features/project/domain/entities/task.dart';
import 'package:mycrewmanager/features/project/domain/repository/project_repository.dart';

class GetUserAssignedTasks implements UseCase<List<ProjectTask>, NoParams> {
  final ProjectRepository repository;

  GetUserAssignedTasks(this.repository);

  @override
  Future<Either<Failure, List<ProjectTask>>> call(NoParams params) async {
    return await repository.getUserAssignedTasks();
  }
}
