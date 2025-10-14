import 'package:dio/dio.dart';
import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:mycrewmanager/core/tokenhandlers/token_interceptor.dart';
import 'package:mycrewmanager/core/tokenhandlers/token_storage.dart';

class ApiClient {
  final Dio dio;
  final TokenStorage _tokenStorage;

  ApiClient({required this.dio, required TokenStorage tokenStorage})
  : _tokenStorage = tokenStorage
  {
    dio.options
      ..baseUrl = Constants.baseUrl
      ..contentType = 'application/json'
      ..connectTimeout = const Duration(seconds: 10)
      ..receiveTimeout = const Duration(seconds: 10);

    dio.interceptors.addAll([
      TokenInterceptor(_tokenStorage),
      LogInterceptor(requestBody: true, responseBody: true),
    ]);
  }
}
