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
      assigneeId = _asNullableInt(assigneeDetails['id']);
      assigneeName = (assigneeDetails['user_name'] ?? assigneeDetails['user_email'])?.toString();
    } else if (json['assignee'] != null) {
      // Old format or direct assignee
      if (json['assignee'] is Map) {
        final assigneeMap = json['assignee'] as Map<String, dynamic>;
        assigneeId = _asNullableInt(assigneeMap['id']);
        assigneeName = (assigneeMap['user_name'] ?? assigneeMap['user_email'])?.toString();
      } else {
        assigneeId = _asNullableInt(json['assignee']);
        assigneeName = null; // Only ID available, no name
      }
    }
    
    return TaskModel(
      id: _asInt(json['id']),
      title: (json['title'] ?? '').toString(),
      status: (json['status'] ?? 'pending').toString(),
      userStoryId: _asInt(json['user_story'] ?? json['user_story_id']),
      isAi: _asBool(json['ai']),
      assigneeId: assigneeId,
      assigneeName: assigneeName,
    );
  }

  static int _asInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }

  static int? _asNullableInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString());
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

