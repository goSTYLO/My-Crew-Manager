import 'package:equatable/equatable.dart';

class Invitation extends Equatable {
  final int id;
  final int projectId;
  final String projectTitle;
  final String invitedBy;
  final String status;
  final String role;
  final String? message;
  final DateTime createdAt;

  const Invitation({
    required this.id,
    required this.projectId,
    required this.projectTitle,
    required this.invitedBy,
    required this.status,
    required this.role,
    this.message,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        projectId,
        projectTitle,
        invitedBy,
        status,
        role,
        message,
        createdAt,
      ];
}
