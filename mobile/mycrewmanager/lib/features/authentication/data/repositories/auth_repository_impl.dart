import 'dart:io';

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
      // Log base URL configuration
      logger.i('🔍 Authentication Request - Base URL: ${Constants.baseUrl}');
      
      if(!await (connectionChecker.isConnected)) {
        logger.w('⚠️ No internet connection detected');
        return left(Failure(Constants.noConnectionErrorMessage));
      }
      
      logger.d('✅ Internet connection check passed, making request...');
      final res = await fn();
      logger.i('✅ Authentication request successful');
      return right(res);
    } on DioException catch (e) {
      // Comprehensive error logging
      logger.e('🔴 Authentication DioException:');
      logger.e('   Type: ${e.type}');
      logger.e('   Message: ${e.message}');
      logger.e('   Error: ${e.error}');
      logger.e('   Base URL: ${e.requestOptions.baseUrl}');
      logger.e('   Path: ${e.requestOptions.path}');
      logger.e('   Full URL: ${e.requestOptions.uri}');
      logger.e('   Method: ${e.requestOptions.method}');
      if (e.response != null) {
        logger.e('   Status Code: ${e.response?.statusCode}');
        logger.e('   Response Data: ${e.response?.data}');
      }
      
      // Better error handling with detailed messages
      if (e.type == DioExceptionType.connectionTimeout || 
          e.type == DioExceptionType.receiveTimeout) {
        logger.e('❌ Connection timeout error');
        return left(Failure("Connection timeout. Please check if the server is running with Daphne."));
      }
      
      // Handle connection refused/connection error explicitly
      if (e.type == DioExceptionType.connectionError || 
          e.type == DioExceptionType.unknown) {
        logger.e('❌ Connection refused/error - Server may not be accessible');
        final errorMsg = e.error?.toString() ?? e.message ?? 'Unknown connection error';
        
        // Check for specific connection refused messages
        final isConnectionRefused = errorMsg.toLowerCase().contains('connection refused') ||
                                   errorMsg.toLowerCase().contains('connection reset') ||
                                   errorMsg.toLowerCase().contains('network is unreachable') ||
                                   (e.error is SocketException && (e.error as SocketException).message.contains('refused'));
        
        if (isConnectionRefused || e.type == DioExceptionType.connectionError) {
          return left(Failure(
            "Connection refused. The backend server cannot be reached.\n\n"
            "Troubleshooting steps:\n"
            "1) Backend is running: daphne -b 0.0.0.0 -p 8000 config.asgi:application\n"
            "2) Windows Firewall: Add inbound rule for port 8000 (see mobile/docs/FIREWALL_FIX_INSTRUCTIONS.md)\n"
            "3) URL is correct: http://10.0.2.2:8000/api/ (for Android emulator)\n"
            "4) Server is bound to 0.0.0.0, not 127.0.0.1\n\n"
            "Error details: $errorMsg"
          ));
        }
        
        // Unknown type but connection-related
        return left(Failure("Connection error: $errorMsg\n\nThis may be a firewall or network issue. Check the troubleshooting steps above."));
      }
      
      if (e.response?.statusCode == 401) {
        logger.w('⚠️ Authentication failed - Invalid credentials');
        return left(Failure("Incorrect Email or Password"));
      }
      
      if (e.response?.statusCode == 500) {
        logger.e('❌ Server error (500) - Backend may need Redis running');
        return left(Failure("Server error. The backend may need Redis running."));
      }
      
      // Generic error with more details
      final errorDetails = 'Type: ${e.type}, Message: ${e.message ?? 'None'}, Error: ${e.error ?? 'None'}';
      logger.e('❌ Generic connection error: $errorDetails');
      return left(Failure("Connection error: ${e.message ?? 'Unknown error'}\n\nDetails: ${e.error?.toString() ?? 'No additional details'}"));
    } on ServerException catch (e) {
      logger.e('❌ ServerException: ${e.message}');
      return left(Failure(e.message));
    } catch (e, stackTrace) {
      logger.e('❌ Unexpected error in authentication: $e');
      logger.e('   Stack trace: $stackTrace');
      return left(Failure("Unexpected error: $e"));
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
