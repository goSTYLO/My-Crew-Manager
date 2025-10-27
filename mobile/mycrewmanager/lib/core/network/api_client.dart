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
      ..connectTimeout = const Duration(seconds: 30)
      ..receiveTimeout = const Duration(seconds: 30)
      ..sendTimeout = const Duration(seconds: 30);

    dio.interceptors.addAll([
      TokenInterceptor(_tokenStorage),
    ]);

    // Add retry interceptor for transient failures
    dio.interceptors.add(
      InterceptorsWrapper(
        onError: (error, handler) async {
          if (error.type == DioExceptionType.connectionTimeout ||
              error.type == DioExceptionType.receiveTimeout ||
              error.response?.statusCode == 502 ||
              error.response?.statusCode == 503) {
            // Retry once after a delay
            await Future.delayed(Duration(seconds: 2));
            try {
              final response = await dio.fetch(error.requestOptions);
              return handler.resolve(response);
            } catch (e) {
              return handler.next(error);
            }
          }
          return handler.next(error);
        },
      ),
    );
  }
}
