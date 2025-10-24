import 'package:mycrewmanager/features/notification/domain/entities/notification.dart';

class NotificationModel extends Notification {
  const NotificationModel({
    required super.id,
    required super.type,
    required super.title,
    required super.message,
    required super.isRead,
    required super.createdAt,
    super.actionUrl,
    super.actor,
    super.objectId,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as int,
      type: json['notification_type'] as String,
      title: json['title'] as String,
      message: json['message'] as String,
      isRead: json['is_read'] as bool,
      createdAt: DateTime.parse(json['created_at'] as String),
      actionUrl: json['action_url'] as String?,
      actor: json['actor_name'] as String?,
      objectId: json['object_id'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'notification_type': type,
      'title': title,
      'message': message,
      'is_read': isRead,
      'created_at': createdAt.toIso8601String(),
      'action_url': actionUrl,
      'actor_name': actor,
      'object_id': objectId,
    };
  }

  NotificationModel copyWith({
    int? id,
    String? type,
    String? title,
    String? message,
    bool? isRead,
    DateTime? createdAt,
    String? actionUrl,
    String? actor,
    int? objectId,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      message: message ?? this.message,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
      actionUrl: actionUrl ?? this.actionUrl,
      actor: actor ?? this.actor,
      objectId: objectId ?? this.objectId,
    );
  }
}
