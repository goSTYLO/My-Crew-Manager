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
    // Handle assignee information from both old format and new assignee_details format
    int? assigneeId;
    String? assigneeName;
    
    if (json['assignee_details'] != null) {
      // New format with assignee_details
      final assigneeDetails = json['assignee_details'] as Map<String, dynamic>;
      assigneeId = assigneeDetails['id'] as int?;
      assigneeName = assigneeDetails['user_name'] as String? ?? assigneeDetails['user_email'] as String?;
    } else if (json['assignee'] != null) {
      // Old format or direct assignee
      if (json['assignee'] is Map) {
        assigneeId = json['assignee']['id'] as int?;
        assigneeName = json['assignee']['user_name'] as String? ?? json['assignee']['user_email'] as String?;
      } else {
        assigneeId = json['assignee'] as int?;
        assigneeName = null; // Only ID available, no name
      }
    }
    
    return TaskModel(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      status: json['status'] ?? 'pending',
      userStoryId: json['user_story'] ?? 0,
      isAi: json['ai'] ?? false,
      assigneeId: assigneeId,
      assigneeName: assigneeName,
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

