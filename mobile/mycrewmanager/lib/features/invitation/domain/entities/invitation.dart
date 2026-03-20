import 'package:equatable/equatable.dart';

class Invitation extends Equatable {
  final int id;
  final int projectId;
  final String projectTitle;
  final int? invitedById;
  final String invitedBy;
  final String? invitedByEmail;
  final String? inviteeName;
  final String? inviteeEmail;
  final String status;
  final String role;
  final String? message;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const Invitation({
    required this.id,
    required this.projectId,
    required this.projectTitle,
    this.invitedById,
    required this.invitedBy,
    this.invitedByEmail,
    this.inviteeName,
    this.inviteeEmail,
    required this.status,
    required this.role,
    this.message,
    required this.createdAt,
    this.updatedAt,
  });

  @override
  List<Object?> get props => [
        id,
        projectId,
        projectTitle,
        invitedById,
        invitedBy,
        invitedByEmail,
        inviteeName,
        inviteeEmail,
        status,
        role,
        message,
        createdAt,
        updatedAt,
      ];
}
