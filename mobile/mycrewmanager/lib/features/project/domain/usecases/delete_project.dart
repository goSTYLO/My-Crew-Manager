import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:mycrewmanager/features/project/domain/repository/project_repository.dart';

class DeleteProject implements UseCase<void, DeleteProjectParams> {
  final ProjectRepository projectRepository;

  DeleteProject(this.projectRepository);

  @override
  Future<Either<Failure, void>> call(DeleteProjectParams params) async {
    return await projectRepository.deleteProject(params.id);
  }
}

class DeleteProjectParams {
  final int id;

  DeleteProjectParams({required this.id});
}
