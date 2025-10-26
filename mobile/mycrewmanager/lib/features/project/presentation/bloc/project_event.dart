part of 'project_bloc.dart';

abstract class ProjectEvent extends Equatable {
  const ProjectEvent();

  @override
  List<Object> get props => [];
}

class ProjectGetProjects extends ProjectEvent {}

class ProjectGetMyProjects extends ProjectEvent {}

class ProjectCreateProject extends ProjectEvent {
  final String title;
  final String summary;

  const ProjectCreateProject({
    required this.title,
    required this.summary,
  });

  @override
  List<Object> get props => [title, summary];
}

class ProjectGetBacklog extends ProjectEvent {
  final int projectId;

  const ProjectGetBacklog({required this.projectId});

  @override
  List<Object> get props => [projectId];
}

class ProjectUpdateProject extends ProjectEvent {
  final int id;
  final String? title;
  final String? summary;

  const ProjectUpdateProject({
    required this.id,
    this.title,
    this.summary,
  });

  @override
  List<Object> get props => [id, title ?? '', summary ?? ''];
}

class ProjectDeleteProject extends ProjectEvent {
  final int id;

  const ProjectDeleteProject({required this.id});

  @override
  List<Object> get props => [id];
}

