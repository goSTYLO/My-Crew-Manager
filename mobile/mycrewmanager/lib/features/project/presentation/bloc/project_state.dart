part of 'project_bloc.dart';

abstract class ProjectState extends Equatable {
  const ProjectState();

  @override
  List<Object> get props => [];
}

class ProjectInitial extends ProjectState {}

class ProjectLoading extends ProjectState {}

class ProjectSuccess extends ProjectState {
  final List<Project> projects;

  const ProjectSuccess({required this.projects});

  @override
  List<Object> get props => [projects];
}

class ProjectCreated extends ProjectState {
  final Project project;

  const ProjectCreated({required this.project});

  @override
  List<Object> get props => [project];
}

class ProjectBacklogLoaded extends ProjectState {
  final Map<String, dynamic> backlog;

  const ProjectBacklogLoaded({required this.backlog});

  @override
  List<Object> get props => [backlog];
}

class ProjectUpdated extends ProjectState {
  final Project project;

  const ProjectUpdated({required this.project});

  @override
  List<Object> get props => [project];
}

class ProjectDeleted extends ProjectState {
  final int projectId;

  const ProjectDeleted({required this.projectId});

  @override
  List<Object> get props => [projectId];
}

class ProjectFailure extends ProjectState {
  final String message;

  const ProjectFailure(this.message);

  @override
  List<Object> get props => [message];
}

