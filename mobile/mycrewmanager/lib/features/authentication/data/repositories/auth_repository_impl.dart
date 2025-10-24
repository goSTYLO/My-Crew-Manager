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
    logger.d("🌐 Making API call to login endpoint for: $email");
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
        logger.d("❌ No internet connection");
        return left(Failure(Constants.noConnectionErrorMessage));
      }
      logger.d("✅ Internet connection available, making API call...");
      final res = await fn();
      logger.d("✅ API call successful, received user data");
      return right(res);
    } on DioException catch (e) {
      logger.d("❌ DioException: ${e.message} - Status: ${e.response?.statusCode}");
      return left(Failure("Incorrect Email or Password"));
    } on ServerException catch (e) {
      logger.d("❌ ServerException: ${e.message}");
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
    required String password
    }) async {
    logger.d("🌐 Making API call to signup endpoint for: $email");
    try {
      if(!await (connectionChecker.isConnected)) {
        logger.d("❌ No internet connection");
        return left(Failure(Constants.noConnectionErrorMessage));
      }
      logger.d("✅ Internet connection available, making signup API call...");
      final message = await remoteDataSource.signup({
        'name': name,
        'email': email,
        'password': password
        }
      );
      logger.d("✅ Signup API call successful, received user data");
      return right(message);
    } on DioException catch(e) {
      logger.d("❌ Signup DioException: ${e.message} - Status: ${e.response?.statusCode}");
      return left(Failure("Error. Try Again!"));
    } on ServerException catch (e) {
      logger.d("❌ Signup ServerException: ${e.message}");
      return left(Failure(e.message));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    logger.d("🌐 Making API call to logout endpoint");
    try {
      if(!await (connectionChecker.isConnected)) {
        logger.d("❌ No internet connection");
        return left(Failure(Constants.noConnectionErrorMessage));
      }
      logger.d("✅ Internet connection available, making logout API call...");
      await remoteDataSource.logout();
      logger.d("✅ Logout API call successful");
      return right(null);
    } on DioException catch(e) {
      logger.d("❌ Logout DioException: ${e.message} - Status: ${e.response?.statusCode}");
      return left(Failure("Logout failed. Try Again!"));
    } on ServerException catch (e) {
      logger.d("❌ Logout ServerException: ${e.message}");
      return left(Failure(e.message));
    }
  }
}
