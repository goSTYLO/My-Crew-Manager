import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:mycrewmanager/core/error/exceptions.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/core/network/connection_checker.dart';
import 'package:mycrewmanager/features/authentication/data/data_sources/auth_remote.dart';
import 'package:mycrewmanager/features/authentication/domain/entities/user.dart';
import 'package:mycrewmanager/features/authentication/domain/repository/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final ConnectionChecker connectionChecker;

  const AuthRepositoryImpl(
    this.remoteDataSource,
    this.connectionChecker
    );

  @override
  Future<Either<Failure, User>> loginWithEmailPassword({
    required String email,
    required String password,
  }) async {
    return _getUser(
      () async => await remoteDataSource.login({
        'email': email,
        'password': password,
        }
      ),
    );
    // try {
    //   final userModel = await remoteDataSource.login({
    //     "email": email,
    //     "password": password,
    //   });
    //   return right(userModel.toEntity());
    // } on DioException catch (e) {
    //   if (e.response?.statusCode == 401) {
    //     return left(Failure("Invalid email or password"));
    //   }
    //   return left(Failure("Server error: ${e.message}"));
    // } catch (e) {
    //   return left(Failure("Unexpected error: $e"));
    // }
  }


  Future<Either<Failure, User>> _getUser(Future<User> Function() fn) async {
    try {
      if(!await (connectionChecker.isConnected)) {
        return left(Failure(Constants.noConnectionErrorMessage));
      }
      final res = await fn();
      return right(res);
    } on DioException catch (e) {
      // Better error handling with detailed messages
      if (e.type == DioExceptionType.connectionTimeout || 
          e.type == DioExceptionType.receiveTimeout) {
        return left(Failure("Connection timeout. Please check if the server is running with Daphne."));
      }
      
      if (e.response?.statusCode == 401) {
        return left(Failure("Incorrect Email or Password"));
      }
      
      if (e.response?.statusCode == 500) {
        return left(Failure("Server error. The backend may need Redis running."));
      }
      
      return left(Failure("Connection error: ${e.message ?? 'Unknown error'}"));
    } on ServerException catch (e) {
      return left(Failure(e.message));
    }
  }
  
  @override
  Future<Either<Failure, User>> getCredentials() async {
    return right(User(id: '', email: '', name: '', token: ''));
  }
  
  @override
  Future<Either<Failure, User>> signupUser({
    required String name, required 
    String email, 
    required String password,
    String? role,
    }) async {
    try {
      if(!await (connectionChecker.isConnected)) {
        return left(Failure(Constants.noConnectionErrorMessage));
      }
      final message = await remoteDataSource.signup({
        'name': name,
        'email': email,
        'password': password,
        if (role != null) 'role': role,
        }
      );
      return right(message);
    } on DioException {
      return left(Failure("Error. Try Again!"));
    } on ServerException catch (e) {
      return left(Failure(e.message));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      if(!await (connectionChecker.isConnected)) {
        return left(Failure(Constants.noConnectionErrorMessage));
      }
      await remoteDataSource.logout();
      return right(null);
    } on DioException {
      return left(Failure("Logout failed. Try Again!"));
    } on ServerException catch (e) {
      return left(Failure(e.message));
    }
  }
}
