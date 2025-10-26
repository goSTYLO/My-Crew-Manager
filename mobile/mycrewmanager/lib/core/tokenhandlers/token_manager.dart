// import 'package:dio/dio.dart';
// import 'token_storage.dart';

// class TokenManager {
//   final Dio dio;

//   TokenManager(this.dio);

//   Future<String?> getAccessToken() async {
//     return await TokenStorage.getAccessToken();
//   }

//   Future<void> saveTokens(String accessToken, String refreshToken) async {
//     await TokenStorage.saveTokens(
//       accessToken: accessToken,
//       refreshToken: refreshToken,
//     );
//   }

//   Future<void> clearTokens() async {
//     await TokenStorage.clearTokens();
//   }

//   /// 🔄 Refresh token flow
//   Future<String?> refreshAccessToken() async {
//     final refreshToken = await TokenStorage.getRefreshToken();
//     if (refreshToken == null) return null;

//     try {
//       final response = await dio.post(
//         "/auth/refresh/",
//         data: {"refresh": refreshToken},
//       );

//       final newAccessToken = response.data["access"];
//       final newRefreshToken = response.data["refresh"] ?? refreshToken;

//       await saveTokens(newAccessToken, newRefreshToken);
//       return newAccessToken;
//     } catch (e) {
//       await clearTokens(); // logout on failure
//       return null;
//     }
//   }
// }
