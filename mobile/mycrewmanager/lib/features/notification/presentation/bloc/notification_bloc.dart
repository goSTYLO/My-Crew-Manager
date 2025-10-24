import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/init_dependencies.dart';
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
    on<NotificationReceived>(_onNotificationReceived);

    // Listen to WebSocket stream
    _wsSubscription = _wsService.notificationStream.listen(
      (notification) {
        add(NotificationReceived(notification));
      },
    );
  }

  void _onLoadNotifications(LoadNotifications event, Emitter<NotificationState> emit) async {
    logger.d("📱 Loading notifications...");
    emit(const NotificationLoading());

    final result = await _notificationRepository.getNotifications();

    result.fold(
      (failure) {
        logger.d("❌ Failed to load notifications: ${failure.message}");
        emit(NotificationError(failure.message));
      },
      (notifications) {
        logger.d("✅ Loaded ${notifications.length} notifications");
        emit(NotificationLoaded(notifications));
      },
    );
  }

  void _onLoadUnreadCount(LoadUnreadCount event, Emitter<NotificationState> emit) async {
    logger.d("📱 Loading unread count...");

    final result = await _notificationRepository.getUnreadCount();

    result.fold(
      (failure) {
        logger.d("❌ Failed to load unread count: ${failure.message}");
        emit(NotificationError(failure.message));
      },
      (count) {
        logger.d("✅ Loaded unread count: $count");
        emit(UnreadCountLoaded(count));
      },
    );
  }

  void _onMarkAsRead(MarkAsRead event, Emitter<NotificationState> emit) async {
    logger.d("📱 Marking notification as read: ${event.notificationId}");

    final result = await _notificationRepository.markAsRead(event.notificationId);

    result.fold(
      (failure) {
        logger.d("❌ Failed to mark notification as read: ${failure.message}");
        emit(NotificationError(failure.message));
      },
      (_) {
        logger.d("✅ Marked notification as read");
        emit(const NotificationActionSuccess("Notification marked as read"));
        // Reload notifications to update the UI
        add(const LoadNotifications());
        add(const LoadUnreadCount());
      },
    );
  }

  void _onMarkAllAsRead(MarkAllAsRead event, Emitter<NotificationState> emit) async {
    logger.d("📱 Marking all notifications as read...");

    final result = await _notificationRepository.markAllAsRead();

    result.fold(
      (failure) {
        logger.d("❌ Failed to mark all notifications as read: ${failure.message}");
        emit(NotificationError(failure.message));
      },
      (_) {
        logger.d("✅ Marked all notifications as read");
        emit(const NotificationActionSuccess("All notifications marked as read"));
        // Reload notifications to update the UI
        add(const LoadNotifications());
        add(const LoadUnreadCount());
      },
    );
  }

  void _onNotificationReceived(NotificationReceived event, Emitter<NotificationState> emit) async {
    logger.d("📨 Received new notification via WebSocket");
    
    // If we have loaded notifications, add the new one to the list
    if (state is NotificationLoaded) {
      final currentState = state as NotificationLoaded;
      final updatedNotifications = [event.notification as notification_entity.Notification, ...currentState.notifications];
      emit(NotificationLoaded(updatedNotifications));
    }
    
    // Update unread count
    add(const LoadUnreadCount());
  }

  @override
  Future<void> close() {
    _wsSubscription?.cancel();
    _wsService.disconnect();
    return super.close();
  }
}
