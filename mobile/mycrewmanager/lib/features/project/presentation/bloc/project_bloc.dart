import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:mycrewmanager/features/project/domain/entities/project.dart';
import 'package:mycrewmanager/features/project/domain/entities/backlog.dart';
import 'package:mycrewmanager/features/project/domain/usecases/get_projects.dart';
import 'package:mycrewmanager/features/project/domain/usecases/get_my_projects.dart';
import 'package:mycrewmanager/features/project/domain/usecases/create_project.dart';
import 'package:mycrewmanager/features/project/domain/usecases/get_project_backlog.dart';
import 'package:mycrewmanager/features/project/domain/usecases/update_project.dart';
import 'package:mycrewmanager/features/project/domain/usecases/delete_project.dart';

part 'project_event.dart';
part 'project_state.dart';

class ProjectBloc extends Bloc<ProjectEvent, ProjectState> {
  final GetProjects _getProjects;
  final GetMyProjects _getMyProjects;
  final CreateProject _createProject;
  final GetProjectBacklog _getProjectBacklog;
  final UpdateProject _updateProject;
  final DeleteProject _deleteProject;

  ProjectBloc({
    required GetProjects getProjects,
    required GetMyProjects getMyProjects,
    required CreateProject createProject,
    required GetProjectBacklog getProjectBacklog,
    required UpdateProject updateProject,
    required DeleteProject deleteProject,
  })  : _getProjects = getProjects,
        _getMyProjects = getMyProjects,
        _createProject = createProject,
        _getProjectBacklog = getProjectBacklog,
        _updateProject = updateProject,
        _deleteProject = deleteProject,
        super(ProjectInitial()) {
    on<ProjectEvent>((_, emit) => emit(ProjectLoading()));
    on<ProjectGetProjects>(_onGetProjects);
    on<ProjectGetMyProjects>(_onGetMyProjects);
    on<ProjectCreateProject>(_onCreateProject);
    on<ProjectGetBacklog>(_onGetBacklog);
    on<ProjectUpdateProject>(_onUpdateProject);
    on<ProjectDeleteProject>(_onDeleteProject);
  }

  void _onGetProjects(ProjectGetProjects event, Emitter<ProjectState> emit) async {
    final res = await _getProjects();

    await res.fold(
      (failure) async {
        logger.d("Failed to get projects: ${failure.message}");
        emit(ProjectFailure(failure.message));
      },
      (projects) async {
        emit(ProjectSuccess(projects: projects));
      },
    );
  }

  void _onGetMyProjects(ProjectGetMyProjects event, Emitter<ProjectState> emit) async {
    final res = await _getMyProjects();

    await res.fold(
      (failure) async {
        logger.d("Failed to get my projects: ${failure.message}");
        emit(ProjectFailure(failure.message));
      },
      (projects) async {
        emit(ProjectSuccess(projects: projects));
      },
    );
  }

  void _onCreateProject(ProjectCreateProject event, Emitter<ProjectState> emit) async {
    final res = await _createProject(
      title: event.title,
      summary: event.summary,
    );

    await res.fold(
      (failure) async {
        logger.d("Failed to create project: ${failure.message}");
        emit(ProjectFailure(failure.message));
      },
      (project) async {
        emit(ProjectCreated(project: project));
      },
    );
  }

  void _onGetBacklog(ProjectGetBacklog event, Emitter<ProjectState> emit) async {
    final res = await _getProjectBacklog(event.projectId);

    await res.fold(
      (failure) async {
        logger.d("Failed to get backlog: ${failure.message}");
        emit(ProjectFailure(failure.message));
      },
      (backlog) async {
        emit(ProjectBacklogLoaded(backlog: backlog));
      },
    );
  }

  void _onUpdateProject(ProjectUpdateProject event, Emitter<ProjectState> emit) async {
    final res = await _updateProject(UpdateProjectParams(
      id: event.id,
      title: event.title ?? '',
      summary: event.summary ?? '',
    ));

    await res.fold(
      (failure) async {
        logger.d("Failed to update project: ${failure.message}");
        emit(ProjectFailure(failure.message));
      },
      (project) async {
        logger.d("Project updated successfully: ${project.title}");
        emit(ProjectUpdated(project: project));
      },
    );
  }

  void _onDeleteProject(ProjectDeleteProject event, Emitter<ProjectState> emit) async {
    final res = await _deleteProject(DeleteProjectParams(id: event.id));

    await res.fold(
      (failure) async {
        logger.d("Failed to delete project: ${failure.message}");
        emit(ProjectFailure(failure.message));
      },
      (_) async {
        logger.d("Project deleted successfully: ${event.id}");
        emit(ProjectDeleted(projectId: event.id));
      },
    );
  }
}

