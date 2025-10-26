import 'package:fpdart/src/either.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:mycrewmanager/features/authentication/domain/entities/user.dart';
import 'package:mycrewmanager/features/authentication/domain/repository/auth_repository.dart';

class UserSignup implements UseCase<User, UserSignupParams> {
  final AuthRepository authRepository;

  const UserSignup(this.authRepository);
  @override
  Future<Either<Failure, User>> call(UserSignupParams params) async {
    return await authRepository.signupUser(
      name: params.name, 
      email: params.email, 
      password: params.password,
      role: params.role,
      );
  }
}

class UserSignupParams {
  final String name;
  final String email;
  final String password;
  final String? role;

  UserSignupParams({required this.name, required this.email, required this.password, this.role});
}