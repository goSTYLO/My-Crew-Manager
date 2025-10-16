import 'package:mycrewmanager/features/project/domain/entities/task.dart';

class TaskModel extends ProjectTask {
  TaskModel({
    required super.id,
    required super.title,
    required super.status,
    required super.userStoryId,
    required super.isAi,
    super.assigneeId,
    super.assigneeName,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      status: json['status'] ?? 'pending',
      userStoryId: json['user_story'] ?? 0,
      isAi: json['ai'] ?? false,
      assigneeId: json['assignee'] is Map ? (json['assignee']['id'] as int?) : (json['assignee'] as int?),
      assigneeName: json['assignee'] is Map ? ((json['assignee']['user_name'] ?? json['assignee']['user_email']) as String?) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'status': status,
      'user_story': userStoryId,
      'ai': isAi,
      'assignee': assigneeId,
    };
  }

  TaskModel copyWith({
    int? id,
    String? title,
    String? status,
    int? userStoryId,
    bool? isAi,
  }) {
    return TaskModel(
      id: id ?? this.id,
      title: title ?? this.title,
      status: status ?? this.status,
      userStoryId: userStoryId ?? this.userStoryId,
      isAi: isAi ?? this.isAi,
      assigneeId: assigneeId ?? this.assigneeId,
      assigneeName: assigneeName ?? this.assigneeName,
    );
  }
}

