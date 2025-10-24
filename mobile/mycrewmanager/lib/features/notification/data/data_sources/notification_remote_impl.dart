import 'package:dio/dio.dart';
import 'package:mycrewmanager/features/notification/data/data_sources/notification_remote.dart';
import 'package:mycrewmanager/features/notification/data/models/notification_model.dart';

class NotificationRemoteDataSourceImpl implements NotificationRemoteDataSource {
  final Dio _dio;
  final NotificationRemoteDataSource _baseDataSource;

  NotificationRemoteDataSourceImpl(this._dio) : _baseDataSource = NotificationRemoteDataSource(_dio);

  @override
  Future<List<NotificationModel>> getNotifications() {
    return _baseDataSource.getNotifications();
  }

  @override
  Future<void> markAsRead(int notificationId) {
    return _baseDataSource.markAsRead(notificationId);
  }

  @override
  Future<void> markAllAsRead() {
    return _baseDataSource.markAllAsRead();
  }

  Future<Map<String, dynamic>> getUnreadCount() async {
    final response = await _dio.get('ai/notifications/unread_count/');
    return response.data as Map<String, dynamic>;
  }
}
