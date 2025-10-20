import 'package:mycrewmanager/features/project/domain/entities/activity.dart';

class ActivityModel extends Activity {
  ActivityModel({
    required super.id,
    required super.title,
    required super.status,
    required super.completedAt,
    required super.userId,
    required super.userName,
    required super.userEmail,
    required super.projectTitle,
  });

  factory ActivityModel.fromJson(Map<String, dynamic> json) {
    return ActivityModel(
      id: json['id'],
      title: json['title'],
      status: json['status'],
      completedAt: json['completed_at'],
      userId: json['user_id'],
      userName: json['user_name'],
      userEmail: json['user_email'],
      projectTitle: json['project_title'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'status': status,
      'completed_at': completedAt,
      'user_id': userId,
      'user_name': userName,
      'user_email': userEmail,
      'project_title': projectTitle,
    };
  }
}
