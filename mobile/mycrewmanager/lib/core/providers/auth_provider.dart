import 'package:flutter_riverpod/flutter_riverpod.dart';

// Auth State Classes
abstract class AuthState {}
class AuthInitial extends AuthState {}
class AuthLoading extends AuthState {}
class AuthAuthenticated extends AuthState {}
class AuthError extends AuthState {
  final String message;
  AuthError(this.message);
}

// Auth Provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier());

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(AuthInitial());

  Future<void> signIn(String email, String password) async {
    state = AuthLoading();
    // Simulate authentication
    await Future.delayed(Duration(seconds: 2));
    if (email == "test@test.com" && password == "password") {
      state = AuthAuthenticated();
    } else {
      state = AuthError("Invalid credentials");
    }
  }
}