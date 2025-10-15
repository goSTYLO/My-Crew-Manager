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
import 'package:mycrewmanager/features/project/data/data_sources/project_remote.dart';
import 'package:mycrewmanager/features/project/data/repositories/project_repository_impl.dart';
import 'package:mycrewmanager/features/project/domain/repository/project_repository.dart';
import 'package:mycrewmanager/features/project/domain/usecases/get_projects.dart';
import 'package:mycrewmanager/features/project/domain/usecases/create_project.dart';
import 'package:mycrewmanager/features/project/domain/usecases/get_project_backlog.dart';
import 'package:mycrewmanager/features/project/domain/usecases/update_project.dart';
import 'package:mycrewmanager/features/project/domain/usecases/delete_project.dart';
import 'package:mycrewmanager/features/project/domain/usecases/get_project_members.dart';
import 'package:mycrewmanager/features/project/domain/usecases/get_project_tasks.dart';
import 'package:mycrewmanager/features/project/domain/usecases/create_member.dart';
import 'package:mycrewmanager/features/project/domain/usecases/delete_member.dart';
import 'package:mycrewmanager/features/project/presentation/bloc/project_bloc.dart';
import 'package:mycrewmanager/features/chat/data/data_sources/chat_remote.dart';
import 'package:mycrewmanager/features/chat/data/repositories/chat_repository_impl.dart';
import 'package:mycrewmanager/features/chat/data/services/chat_ws_service.dart';

final serviceLocator = GetIt.I;
final logger = Logger();

Future<void> initDependencies() async {

  _initAuth();
  _initProject();
  _initChat();

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

void _initChat() {
  serviceLocator
      ..registerFactory<ChatRemoteDataSource>(() => ChatRemoteDataSource(serviceLocator<Dio>()))
      ..registerLazySingleton<ChatRepositoryImpl>(() => ChatRepositoryImpl(serviceLocator<ChatRemoteDataSource>()))
      ..registerLazySingleton<ChatWsService>(() => ChatWsService(serviceLocator<TokenStorage>()));
}

void _initProject() {
  serviceLocator
      //Data source
      ..registerFactory<ProjectRemoteDataSource>(
      () => ProjectRemoteDataSource(serviceLocator<Dio>()),
    )
          //Use cases
          ..registerFactory(() => GetProjects(serviceLocator()))
          ..registerFactory(() => CreateProject(serviceLocator()))
          ..registerFactory(() => GetProjectBacklog(serviceLocator()))
          ..registerFactory(() => UpdateProject(serviceLocator()))
          ..registerFactory(() => DeleteProject(serviceLocator()))
          ..registerFactory(() => GetProjectMembers(serviceLocator()))
          ..registerFactory(() => GetProjectTasks(serviceLocator()))
          ..registerFactory(() => CreateMember(serviceLocator()))
          ..registerFactory(() => DeleteMember(serviceLocator()))

      //Repository
      ..registerFactory<ProjectRepository>(
        () => ProjectRepositoryImpl(serviceLocator(), serviceLocator()),
      )
      // BLoC
      ..registerLazySingleton(
        () => ProjectBloc(
        getProjects: serviceLocator(),
        createProject: serviceLocator(),
        getProjectBacklog: serviceLocator(),
        updateProject: serviceLocator(),
        deleteProject: serviceLocator(),
      ),
    );
}