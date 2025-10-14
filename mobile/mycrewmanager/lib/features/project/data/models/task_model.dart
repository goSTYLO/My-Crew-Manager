import 'package:mycrewmanager/features/project/domain/entities/task.dart';

class TaskModel extends ProjectTask {
  TaskModel({
    required super.id,
    required super.title,
    required super.status,
    required super.userStoryId,
    required super.isAi,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      status: json['status'] ?? 'pending',
      userStoryId: json['user_story'] ?? 0,
      isAi: json['ai'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'status': status,
      'user_story': userStoryId,
      'ai': isAi,
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
    );
  }
}

