import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:mycrewmanager/features/notification/data/models/notification_model.dart';

part 'notification_remote.g.dart';

@RestApi(baseUrl: "ai/notifications/")
abstract class NotificationRemoteDataSource {
  factory NotificationRemoteDataSource(Dio dio) = _NotificationRemoteDataSource;

  @GET("")
  Future<List<NotificationModel>> getNotifications();

  @POST("{id}/mark_read/")
  Future<void> markAsRead(@Path("id") int notificationId);

  @POST("mark_all_read/")
  Future<void> markAllAsRead();

  @DELETE("{id}/")
  Future<void> removeNotification(@Path("id") int notificationId);
}
