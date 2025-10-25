import 'backlog_task.dart';

class UserStory {
  final int id;
  final String title;
  final bool ai;
  final bool isComplete;
  final List<BacklogTask> tasks;

  UserStory({
    required this.id,
    required this.title,
    required this.ai,
    required this.isComplete,
    required this.tasks,
  });

  factory UserStory.fromJson(Map<String, dynamic> json) {
    return UserStory(
      id: json['id'] as int,
      title: json['title'] as String,
      ai: json['ai'] as bool,
      isComplete: json['is_complete'] as bool,
      tasks: (json['tasks'] as List<dynamic>?)
          ?.map((task) => BacklogTask.fromJson(task))
          .toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'ai': ai,
      'is_complete': isComplete,
      'tasks': tasks.map((task) => task.toJson()).toList(),
    };
  }
}
