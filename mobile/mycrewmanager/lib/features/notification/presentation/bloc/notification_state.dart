import 'package:equatable/equatable.dart';
import 'package:mycrewmanager/features/notification/domain/entities/notification.dart';

abstract class NotificationState extends Equatable {
  const NotificationState();

  @override
  List<Object?> get props => [];
}

class NotificationInitial extends NotificationState {
  const NotificationInitial();
}

class NotificationLoading extends NotificationState {
  const NotificationLoading();
}

class NotificationLoaded extends NotificationState {
  final List<Notification> notifications;

  const NotificationLoaded(this.notifications);

  @override
  List<Object?> get props => [notifications];
}

class UnreadCountLoaded extends NotificationState {
  final int unreadCount;

  const UnreadCountLoaded(this.unreadCount);

  @override
  List<Object?> get props => [unreadCount];
}

class NotificationError extends NotificationState {
  final String message;

  const NotificationError(this.message);

  @override
  List<Object?> get props => [message];
}

class NotificationActionSuccess extends NotificationState {
  final String message;

  const NotificationActionSuccess(this.message);

  @override
  List<Object?> get props => [message];
}
