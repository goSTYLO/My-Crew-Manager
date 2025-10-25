import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/features/authentication/domain/entities/user.dart';

abstract interface class AuthRepository {
  Future<Either<Failure, User>> loginWithEmailPassword({
    required String email,
    required String password,
  });

  Future<Either<Failure, User>> signupUser({
    required String name,
    required String email,
    required String password,
    String? role,
  });

  Future<Either<Failure, User>> getCredentials();
} 