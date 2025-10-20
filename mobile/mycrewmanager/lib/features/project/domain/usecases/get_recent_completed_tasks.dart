import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:mycrewmanager/features/project/domain/entities/activity.dart';
import 'package:mycrewmanager/features/project/domain/repository/project_repository.dart';

class GetRecentCompletedTasks implements UseCase<List<Activity>, NoParams> {
  final ProjectRepository repository;

  GetRecentCompletedTasks(this.repository);

  @override
  Future<Either<Failure, List<Activity>>> call(NoParams params) async {
    return await repository.getRecentCompletedTasks();
  }
}
