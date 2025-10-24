import 'package:dio/dio.dart';
import 'package:mycrewmanager/features/authentication/data/models/user_model.dart';
import 'package:retrofit/retrofit.dart';

part 'auth_remote.g.dart';

@RestApi(baseUrl: "user/")
abstract class AuthRemoteDataSource {
  factory AuthRemoteDataSource(Dio dio, {String baseUrl}) = _AuthRemoteDataSource;

  @POST("login/")
  Future<UserModel> login(@Body() Map<String, dynamic> body);

  @POST("signup/")
  Future<UserModel> signup(@Body() Map<String, dynamic> body);

  @POST("logout/")
  Future<void> logout();

  // @GET("me/")
  // Future<UserModel> getCredentials();
}
