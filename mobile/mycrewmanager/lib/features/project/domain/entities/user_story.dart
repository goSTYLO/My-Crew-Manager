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
      id: _asInt(json['id']),
      title: (json['title'] ?? '').toString(),
      ai: _asBool(json['ai']),
      isComplete: _asBool(json['is_complete']),
      tasks: (json['tasks'] as List<dynamic>?)
          ?.map((task) => BacklogTask.fromJson(task))
          .toList() ?? [],
    );
  }

  static int _asInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }

  static bool _asBool(dynamic value) {
    if (value is bool) return value;
    if (value is num) return value != 0;
    if (value == null) return false;
    final lowered = value.toString().toLowerCase();
    return lowered == 'true' || lowered == '1' || lowered == 'yes';
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
