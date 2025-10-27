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
    logger.d("🌐 Making API call to get notifications");
    try {
      if (!await connectionChecker.isConnected) {
        logger.d("❌ No internet connection");
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      logger.d("✅ Internet connection available, making get notifications API call...");
      final notificationModels = await remoteDataSource.getNotifications();
      logger.d("✅ Get notifications API call successful");
      return right(notificationModels);
    } on DioException catch (e) {
      logger.d("❌ Get notifications DioException: ${e.message} - Status: ${e.response?.statusCode}");
      return left(Failure("Failed to load notifications. Try Again!"));
    }
  }

  @override
  Future<Either<Failure, int>> getUnreadCount() async {
    logger.d("🌐 Making API call to get unread count");
    try {
      if (!await connectionChecker.isConnected) {
        logger.d("❌ No internet connection");
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      logger.d("✅ Internet connection available, making get unread count API call...");
      final response = await (remoteDataSource as dynamic).getUnreadCount();
      final count = response['unread_count'] as int;
      logger.d("✅ Get unread count API call successful: $count");
      return right(count);
    } on DioException catch (e) {
      logger.d("❌ Get unread count DioException: ${e.message} - Status: ${e.response?.statusCode}");
      return left(Failure("Failed to load unread count. Try Again!"));
    }
  }

  @override
  Future<Either<Failure, void>> markAsRead(int notificationId) async {
    logger.d("🌐 Making API call to mark notification as read: $notificationId");
    try {
      if (!await connectionChecker.isConnected) {
        logger.d("❌ No internet connection");
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      logger.d("✅ Internet connection available, making mark as read API call...");
      await remoteDataSource.markAsRead(notificationId);
      logger.d("✅ Mark as read API call successful");
      return right(null);
    } on DioException catch (e) {
      logger.d("❌ Mark as read DioException: ${e.message} - Status: ${e.response?.statusCode}");
      return left(Failure("Failed to mark notification as read. Try Again!"));
    }
  }

  @override
  Future<Either<Failure, void>> markAllAsRead() async {
    logger.d("🌐 Making API call to mark all notifications as read");
    try {
      if (!await connectionChecker.isConnected) {
        logger.d("❌ No internet connection");
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      logger.d("✅ Internet connection available, making mark all as read API call...");
      await remoteDataSource.markAllAsRead();
      logger.d("✅ Mark all as read API call successful");
      return right(null);
    } on DioException catch (e) {
      logger.d("❌ Mark all as read DioException: ${e.message} - Status: ${e.response?.statusCode}");
      return left(Failure("Failed to mark all notifications as read. Try Again!"));
    }
  }

  @override
  Future<Either<Failure, void>> removeNotification(int notificationId) async {
    logger.d("🌐 Making API call to remove notification: $notificationId");
    try {
      if (!await connectionChecker.isConnected) {
        logger.d("❌ No internet connection");
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      logger.d("✅ Internet connection available, making remove notification API call...");
      await remoteDataSource.removeNotification(notificationId);
      logger.d("✅ Remove notification API call successful");
      return right(null);
    } on DioException catch (e) {
      logger.d("❌ Remove notification DioException: ${e.message} - Status: ${e.response?.statusCode}");
      return left(Failure("Failed to remove notification. Try Again!"));
    }
  }
}
