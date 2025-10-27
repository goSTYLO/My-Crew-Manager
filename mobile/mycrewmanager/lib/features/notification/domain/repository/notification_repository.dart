import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/features/notification/domain/entities/notification.dart';

abstract interface class NotificationRepository {
  Future<Either<Failure, List<Notification>>> getNotifications();
  Future<Either<Failure, int>> getUnreadCount();
  Future<Either<Failure, void>> markAsRead(int notificationId);
  Future<Either<Failure, void>> markAllAsRead();
  Future<Either<Failure, void>> removeNotification(int notificationId);
}
