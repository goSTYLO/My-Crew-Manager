import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/features/notification/domain/entities/notification.dart' as notification_entity;
import 'package:mycrewmanager/features/notification/domain/repository/notification_repository.dart';
import 'package:mycrewmanager/features/notification/data/services/notification_ws_service.dart';
import 'package:mycrewmanager/features/notification/presentation/bloc/notification_event.dart';
import 'package:mycrewmanager/features/notification/presentation/bloc/notification_state.dart';

class NotificationBloc extends Bloc<NotificationEvent, NotificationState> {
  final NotificationRepository _notificationRepository;
  final NotificationWsService _wsService;
  StreamSubscription? _wsSubscription;

  NotificationBloc({
    required NotificationRepository notificationRepository,
    required NotificationWsService wsService,
  })  : _notificationRepository = notificationRepository,
        _wsService = wsService,
        super(const NotificationInitial()) {
    on<LoadNotifications>(_onLoadNotifications);
    on<LoadUnreadCount>(_onLoadUnreadCount);
    on<MarkAsRead>(_onMarkAsRead);
    on<MarkAllAsRead>(_onMarkAllAsRead);
    on<RemoveNotification>(_onRemoveNotification);
    on<NotificationReceived>(_onNotificationReceived);

    // Listen to WebSocket stream
    _wsSubscription = _wsService.notificationStream.listen(
      (notification) {
        add(NotificationReceived(notification));
      },
    );
  }

  void _onLoadNotifications(LoadNotifications event, Emitter<NotificationState> emit) async {
    emit(const NotificationLoading());

    try {
      final result = await _notificationRepository.getNotifications();

      if (result.isLeft()) {
        final failure = result.fold((l) => l, (r) => throw Exception("Unexpected right value"));
        emit(NotificationError(failure.message));
        return;
      }

      final notifications = result.fold((l) => throw Exception("Unexpected left value"), (r) => r);
      
      // Filter out notifications for accepted invitations
      try {
        // Add timeout to prevent hanging
        final filteredNotifications = await _filterAcceptedInvitationNotifications(notifications)
            .timeout(const Duration(seconds: 10));
        emit(NotificationLoaded(filteredNotifications));
      } on TimeoutException {
        emit(NotificationLoaded(notifications));
      } catch (e) {
        // If filtering fails, show all notifications
        emit(NotificationLoaded(notifications));
      }
    } catch (e) {
      emit(NotificationError("Failed to load notifications: $e"));
    }
  }

  void _onLoadUnreadCount(LoadUnreadCount event, Emitter<NotificationState> emit) async {

    final result = await _notificationRepository.getUnreadCount();

    result.fold(
      (failure) {
        emit(NotificationError(failure.message));
      },
      (count) {
        emit(UnreadCountLoaded(count));
      },
    );
  }

  void _onMarkAsRead(MarkAsRead event, Emitter<NotificationState> emit) async {

    final result = await _notificationRepository.markAsRead(event.notificationId);

    result.fold(
      (failure) {
        emit(NotificationError(failure.message));
      },
      (_) {
        emit(const NotificationActionSuccess("Notification marked as read"));
        // Reload notifications to update the UI
        add(const LoadNotifications());
        add(const LoadUnreadCount());
      },
    );
  }

  void _onMarkAllAsRead(MarkAllAsRead event, Emitter<NotificationState> emit) async {

    final result = await _notificationRepository.markAllAsRead();

    result.fold(
      (failure) {
        emit(NotificationError(failure.message));
      },
      (_) {
        emit(const NotificationActionSuccess("All notifications marked as read"));
        // Reload notifications to update the UI
        add(const LoadNotifications());
        add(const LoadUnreadCount());
      },
    );
  }

  void _onRemoveNotification(RemoveNotification event, Emitter<NotificationState> emit) async {

    final result = await _notificationRepository.removeNotification(event.notificationId);

    result.fold(
      (failure) {
        emit(NotificationError(failure.message));
      },
      (_) {
        emit(const NotificationActionSuccess("Notification removed"));
        // Reload notifications to update the UI
        add(const LoadNotifications());
        add(const LoadUnreadCount());
      },
    );
  }

  void _onNotificationReceived(NotificationReceived event, Emitter<NotificationState> emit) async {
    
    // If we have loaded notifications, add the new one to the list
    if (state is NotificationLoaded) {
      final currentState = state as NotificationLoaded;
      final updatedNotifications = [event.notification as notification_entity.Notification, ...currentState.notifications];
      emit(NotificationLoaded(updatedNotifications));
    }
    
    // Update unread count
    add(const LoadUnreadCount());
  }

  Future<List<notification_entity.Notification>> _filterAcceptedInvitationNotifications(
    List<notification_entity.Notification> notifications
  ) async {
    try {
      
      // Filter out read notifications (is_read = true)
      final filteredNotifications = notifications.where((notification) {
        final shouldKeep = !notification.isRead;
        if (!shouldKeep) {
        } else {
        }
        return shouldKeep;
      }).toList();
      
      return filteredNotifications;
    } catch (e) {
      // If there's an error, return all notifications to be safe
      return notifications;
    }
  }

  @override
  Future<void> close() {
    _wsSubscription?.cancel();
    _wsService.disconnect();
    return super.close();
  }
}
