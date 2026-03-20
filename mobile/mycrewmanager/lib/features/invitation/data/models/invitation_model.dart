import 'package:mycrewmanager/features/invitation/domain/entities/invitation.dart';

class InvitationModel extends Invitation {
  const InvitationModel({
    required super.id,
    required super.projectId,
    required super.projectTitle,
    super.invitedById,
    required super.invitedBy,
    super.invitedByEmail,
    super.inviteeName,
    super.inviteeEmail,
    required super.status,
    required super.role,
    super.message,
    required super.createdAt,
    super.updatedAt,
  });

  static int _asInt(dynamic value, {int fallback = 0}) {
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? fallback;
    if (value is num) return value.toInt();
    return fallback;
  }

  factory InvitationModel.fromJson(Map<String, dynamic> json) {
    final projectValue = json['project'];
    final projectId = projectValue is Map<String, dynamic>
        ? _asInt(projectValue['id'])
        : _asInt(projectValue);
    final projectTitle = (json['project_title'] as String?) ??
        (projectValue is Map<String, dynamic> ? (projectValue['title'] as String? ?? 'Untitled Project') : 'Untitled Project');

    return InvitationModel(
      id: _asInt(json['id']),
      projectId: projectId,
      projectTitle: projectTitle,
      invitedById: json['invited_by'] == null ? null : _asInt(json['invited_by']),
      invitedBy: (json['invited_by_name'] as String?) ?? 'Unknown',
      invitedByEmail: json['invited_by_email'] as String?,
      inviteeName: json['invitee_name'] as String?,
      inviteeEmail: json['invitee_email'] as String?,
      status: json['status'] as String,
      role: json['role'] as String,
      message: json['message'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] == null ? null : DateTime.tryParse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'project': projectId,
      'project_title': projectTitle,
      'invited_by': invitedById,
      'invited_by_name': invitedBy,
      'invited_by_email': invitedByEmail,
      'invitee_name': inviteeName,
      'invitee_email': inviteeEmail,
      'status': status,
      'role': role,
      'message': message,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  InvitationModel copyWith({
    int? id,
    int? projectId,
    String? projectTitle,
    int? invitedById,
    String? invitedBy,
    String? invitedByEmail,
    String? inviteeName,
    String? inviteeEmail,
    String? status,
    String? role,
    String? message,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return InvitationModel(
      id: id ?? this.id,
      projectId: projectId ?? this.projectId,
      projectTitle: projectTitle ?? this.projectTitle,
      invitedById: invitedById ?? this.invitedById,
      invitedBy: invitedBy ?? this.invitedBy,
      invitedByEmail: invitedByEmail ?? this.invitedByEmail,
      inviteeName: inviteeName ?? this.inviteeName,
      inviteeEmail: inviteeEmail ?? this.inviteeEmail,
      status: status ?? this.status,
      role: role ?? this.role,
      message: message ?? this.message,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
