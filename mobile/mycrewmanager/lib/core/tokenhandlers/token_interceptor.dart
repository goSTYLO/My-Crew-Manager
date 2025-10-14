import 'package:dio/dio.dart';
import 'package:mycrewmanager/core/tokenhandlers/token_storage.dart';

class TokenInterceptor extends Interceptor {
  final TokenStorage tokenStorage;

  TokenInterceptor(this.tokenStorage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await tokenStorage.getToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Token $token';
    }
    super.onRequest(options, handler);
  }
}