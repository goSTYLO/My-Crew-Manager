import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:mycrewmanager/core/error/exceptions.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/core/network/connection_checker.dart';
import 'package:mycrewmanager/features/project/data/data_sources/project_remote.dart';
import 'package:mycrewmanager/features/project/domain/entities/project.dart';
import 'package:mycrewmanager/features/project/domain/entities/member.dart';
import 'package:mycrewmanager/features/project/domain/entities/task.dart';
import 'package:mycrewmanager/features/project/domain/repository/project_repository.dart';

class ProjectRepositoryImpl implements ProjectRepository {
  final ProjectRemoteDataSource remoteDataSource;
  final ConnectionChecker connectionChecker;

  const ProjectRepositoryImpl(
    this.remoteDataSource,
    this.connectionChecker,
  );

  @override
  Future<Either<Failure, List<Project>>> getProjects() async {
    return _getData(
      () async => await remoteDataSource.getProjects(),
    );
  }

  @override
  Future<Either<Failure, Project>> getProject(int id) async {
    return _getData(
      () async => await remoteDataSource.getProject(id),
    );
  }

  @override
  Future<Either<Failure, Project>> createProject({
    required String title,
    required String summary,
  }) async {
    return _getData(
      () async => await remoteDataSource.createProject({
        'title': title,
        'summary': summary,
      }),
    );
  }

  @override
  Future<Either<Failure, Project>> updateProject({
    required int id,
    required String title,
    required String summary,
  }) async {
    return _getData(
      () async => await remoteDataSource.updateProject(id, {
        'title': title,
        'summary': summary,
      }),
    );
  }

  @override
  Future<Either<Failure, void>> deleteProject(int id) async {
    return _getData(
      () async {
        await remoteDataSource.deleteProject(id);
        return null;
      },
    );
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> getProjectBacklog(int id) async {
    return _getData(
      () async => await remoteDataSource.getProjectBacklog(id),
    );
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> uploadProposal({
    required String filePath,
    required int projectId,
  }) async {
    return left(Failure("Upload proposal not implemented yet"));
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> ingestProposal({
    required int projectId,
    required int proposalId,
    String? title,
  }) async {
    return left(Failure("Ingest proposal not implemented yet"));
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> generateBacklog({
    required int projectId,
  }) async {
    return left(Failure("Generate backlog not implemented yet"));
  }

  @override
  Future<Either<Failure, List<Member>>> getProjectMembers(int projectId) {
    return _getData(
      () async => await remoteDataSource.getProjectMembers(projectId),
    );
  }

  @override
  Future<Either<Failure, Member>> createMember({
    required String name,
    required String role,
    required String email,
    required int projectId,
  }) {
    return _getData(
      () async => await remoteDataSource.createMember(
        name: name,
        role: role,
        email: email,
        projectId: projectId,
      ),
    );
  }

  @override
  Future<Either<Failure, void>> deleteMember(int id) {
    return _getData(
      () async => await remoteDataSource.deleteMember(id),
    );
  }

  @override
  Future<Either<Failure, List<ProjectTask>>> getProjectTasks(int projectId) {
    return _getData(
      () async => await remoteDataSource.getProjectTasks(projectId),
    );
  }

  Future<Either<Failure, T>> _getData<T>(Future<T> Function() fn) async {
    try {
      if (!await connectionChecker.isConnected) {
        return left(Failure(Constants.noConnectionErrorMessage));
      }
      final res = await fn();
      return right(res);
    } on DioException catch (e) {
      return left(Failure("Network error: ${e.message}"));
    } on ServerException catch (e) {
      return left(Failure(e.message));
    }
  }
}

