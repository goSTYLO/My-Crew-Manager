import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:mycrewmanager/features/project/domain/entities/member.dart';
import 'package:mycrewmanager/features/project/domain/repository/project_repository.dart';

class GetProjectMembers implements UseCase<List<Member>, GetProjectMembersParams> {
  final ProjectRepository projectRepository;

  GetProjectMembers(this.projectRepository);

  @override
  Future<Either<Failure, List<Member>>> call(GetProjectMembersParams params) async {
    return await projectRepository.getProjectMembers(params.projectId);
  }
}

class GetProjectMembersParams {
  final int projectId;

  GetProjectMembersParams({required this.projectId});
}
