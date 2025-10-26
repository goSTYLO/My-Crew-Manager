import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:mycrewmanager/features/project/domain/entities/member.dart';
import 'package:mycrewmanager/features/project/domain/repository/project_repository.dart';

class CreateMember implements UseCase<Member, CreateMemberParams> {
  final ProjectRepository projectRepository;

  CreateMember(this.projectRepository);

  @override
  Future<Either<Failure, Member>> call(CreateMemberParams params) async {
    return await projectRepository.createMember(
      name: params.name,
      role: params.role,
      email: params.email,
      projectId: params.projectId,
    );
  }
}

class CreateMemberParams {
  final String name;
  final String role;
  final String email;
  final int projectId;

  CreateMemberParams({
    required this.name,
    required this.role,
    required this.email,
    required this.projectId,
  });
}
