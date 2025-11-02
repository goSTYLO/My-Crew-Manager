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
      // Add logging interceptor to see all requests and responses
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        requestHeader: true,
        responseHeader: false,
        error: true,
        logPrint: (obj) {
          logger.d('📡 HTTP: $obj');
        },
      ),
      TokenInterceptor(_tokenStorage),
    ]);

    // Add retry interceptor for transient failures with detailed error logging
    dio.interceptors.add(
      InterceptorsWrapper(
        onError: (error, handler) async {
          // Log detailed error information
          logger.e('🔴 API Error Details:');
          logger.e('   Type: ${error.type}');
          logger.e('   Message: ${error.message}');
          logger.e('   Error: ${error.error}');
          logger.e('   Base URL: ${error.requestOptions.baseUrl}');
          logger.e('   Path: ${error.requestOptions.path}');
          logger.e('   Full URL: ${error.requestOptions.uri}');
          logger.e('   Method: ${error.requestOptions.method}');
          if (error.response != null) {
            logger.e('   Status Code: ${error.response?.statusCode}');
            logger.e('   Response Data: ${error.response?.data}');
          }
          
          if (error.type == DioExceptionType.connectionTimeout ||
              error.type == DioExceptionType.receiveTimeout ||
              error.response?.statusCode == 502 ||
              error.response?.statusCode == 503) {
            logger.w('⚠️ Retrying request after transient failure...');
            // Retry once after a delay
            await Future.delayed(Duration(seconds: 2));
            try {
              final response = await dio.fetch(error.requestOptions);
              return handler.resolve(response);
            } catch (e) {
              logger.e('❌ Retry failed: $e');
              return handler.next(error);
            }
          }
          return handler.next(error);
        },
      ),
    );
  }
}
