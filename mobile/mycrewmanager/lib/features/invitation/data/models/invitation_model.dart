import 'package:mycrewmanager/features/invitation/domain/entities/invitation.dart';

class InvitationModel extends Invitation {
  const InvitationModel({
    required super.id,
    required super.projectId,
    required super.projectTitle,
    required super.invitedBy,
    required super.status,
    required super.role,
    super.message,
    required super.createdAt,
  });

  factory InvitationModel.fromJson(Map<String, dynamic> json) {
    return InvitationModel(
      id: json['id'] as int,
      projectId: json['project'] as int,
      projectTitle: json['project_title'] as String,
      invitedBy: json['invited_by_name'] as String,
      status: json['status'] as String,
      role: json['role'] as String,
      message: json['message'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'project': projectId,
      'project_title': projectTitle,
      'invited_by_name': invitedBy,
      'status': status,
      'role': role,
      'message': message,
      'created_at': createdAt.toIso8601String(),
    };
  }

  InvitationModel copyWith({
    int? id,
    int? projectId,
    String? projectTitle,
    String? invitedBy,
    String? status,
    String? role,
    String? message,
    DateTime? createdAt,
  }) {
    return InvitationModel(
      id: id ?? this.id,
      projectId: projectId ?? this.projectId,
      projectTitle: projectTitle ?? this.projectTitle,
      invitedBy: invitedBy ?? this.invitedBy,
      status: status ?? this.status,
      role: role ?? this.role,
      message: message ?? this.message,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
