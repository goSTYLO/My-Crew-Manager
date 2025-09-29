import 'package:dio/dio.dart';
import 'package:get_it/get_it.dart';
import 'package:internet_connection_checker_plus/internet_connection_checker_plus.dart';
import 'package:logger/logger.dart';
import 'package:mycrewmanager/core/network/api_client.dart';
import 'package:mycrewmanager/core/network/connection_checker.dart';
import 'package:mycrewmanager/core/tokenhandlers/token_storage.dart';
import 'package:mycrewmanager/features/authentication/data/data_sources/auth_remote.dart';
import 'package:mycrewmanager/features/authentication/data/repositories/auth_repository_impl.dart';
import 'package:mycrewmanager/features/authentication/domain/repository/auth_repository.dart';
import 'package:mycrewmanager/features/authentication/domain/usecases/user_login.dart';
import 'package:mycrewmanager/features/authentication/domain/usecases/user_signup.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';

final serviceLocator = GetIt.asNewInstance();
final logger = Logger();

Future<void> initDependencies() async {

  _initAuth();

  final dio = Dio();
  
  serviceLocator
    ..registerLazySingleton<TokenStorage>(() => TokenStorage())
    ..registerLazySingleton(() => ApiClient(dio: dio, tokenStorage: serviceLocator<TokenStorage>()).dio)
    ..registerFactory(() => InternetConnection())
    ..registerFactory<ConnectionChecker>(
      () => ConnectionCheckerImpl(serviceLocator()),
    );
}

void _initAuth() {
  serviceLocator
      //Data source
      ..registerFactory<AuthRemoteDataSource>(
      () => AuthRemoteDataSource(serviceLocator<Dio>()),
    )
      //Use cases
      ..registerFactory(() => UserLogin(serviceLocator()))
      ..registerFactory(() => UserSignup(serviceLocator()))

      //Repository
      ..registerFactory<AuthRepository>(
        () => AuthRepositoryImpl(serviceLocator(), serviceLocator()),
      )
      // BLoC
      ..registerLazySingleton(
        () => AuthBloc(
        userLogin: serviceLocator(),
        userSignup: serviceLocator(),
        tokenStorage: serviceLocator<TokenStorage>()
      ),
    );
}