import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:mycrewmanager/features/project/domain/repository/project_repository.dart';

class DeleteMember implements UseCase<void, DeleteMemberParams> {
  final ProjectRepository projectRepository;

  DeleteMember(this.projectRepository);

  @override
  Future<Either<Failure, void>> call(DeleteMemberParams params) async {
    return await projectRepository.deleteMember(params.id);
  }
}

class DeleteMemberParams {
  final int id;

  DeleteMemberParams({required this.id});
}
