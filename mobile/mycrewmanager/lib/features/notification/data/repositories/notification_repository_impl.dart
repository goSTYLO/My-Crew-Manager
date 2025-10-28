import 'package:fpdart/fpdart.dart';
import 'package:dio/dio.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/core/network/connection_checker.dart';
import 'package:mycrewmanager/core/constants/constants.dart' as constants;
import 'package:mycrewmanager/features/notification/domain/entities/notification.dart';
import 'package:mycrewmanager/features/notification/domain/repository/notification_repository.dart';
import 'package:mycrewmanager/features/notification/data/data_sources/notification_remote.dart';
import 'package:mycrewmanager/init_dependencies.dart';

class NotificationRepositoryImpl implements NotificationRepository {
  final NotificationRemoteDataSource remoteDataSource;
  final ConnectionChecker connectionChecker;

  NotificationRepositoryImpl(this.remoteDataSource, this.connectionChecker);

  @override
  Future<Either<Failure, List<Notification>>> getNotifications() async {
    try {
      if (!await connectionChecker.isConnected) {
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      final notificationModels = await remoteDataSource.getNotifications();
      return right(notificationModels);
    } on DioException {
      return left(Failure("Failed to load notifications. Try Again!"));
    }
  }

  @override
  Future<Either<Failure, int>> getUnreadCount() async {
    try {
      if (!await connectionChecker.isConnected) {
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      final response = await (remoteDataSource as dynamic).getUnreadCount();
      final count = response['unread_count'] as int;
      return right(count);
    } on DioException {
      return left(Failure("Failed to load unread count. Try Again!"));
    }
  }

  @override
  Future<Either<Failure, void>> markAsRead(int notificationId) async {
    try {
      if (!await connectionChecker.isConnected) {
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      await remoteDataSource.markAsRead(notificationId);
      return right(null);
    } on DioException {
      return left(Failure("Failed to mark notification as read. Try Again!"));
    }
  }

  @override
  Future<Either<Failure, void>> markAllAsRead() async {
    try {
      if (!await connectionChecker.isConnected) {
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      await remoteDataSource.markAllAsRead();
      return right(null);
    } on DioException {
      return left(Failure("Failed to mark all notifications as read. Try Again!"));
    }
  }

  @override
  Future<Either<Failure, void>> removeNotification(int notificationId) async {
    try {
      if (!await connectionChecker.isConnected) {
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      await remoteDataSource.removeNotification(notificationId);
      return right(null);
    } on DioException {
      return left(Failure("Failed to remove notification. Try Again!"));
    }
  }
}
