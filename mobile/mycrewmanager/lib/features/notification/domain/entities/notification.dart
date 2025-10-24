import 'package:equatable/equatable.dart';

class Notification extends Equatable {
  final int id;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final DateTime createdAt;
  final String? actionUrl;
  final String? actor;
  final int? objectId;

  const Notification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
    this.actionUrl,
    this.actor,
    this.objectId,
  });

  @override
  List<Object?> get props => [
        id,
        type,
        title,
        message,
        isRead,
        createdAt,
        actionUrl,
        actor,
        objectId,
      ];
}
