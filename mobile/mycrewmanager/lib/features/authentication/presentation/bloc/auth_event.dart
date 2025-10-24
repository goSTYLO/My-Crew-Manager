part of 'auth_bloc.dart';

@immutable
sealed class AuthEvent {}

final class AuthSignUp extends AuthEvent {
  final String email;
  final String name;
  final String password;
  final String? role;

  AuthSignUp({
    required this.email,
    required this.name,
    required this.password,
    this.role,
  });
}

final class AuthLogin extends AuthEvent {
  final String email;
  final String password;

  AuthLogin({
    required this.email, 
    required this.password,
  });
}

final class AuthIsUserLoggedIn extends AuthEvent {

}

final class UpdateUserRole extends AuthEvent {
  final String role;

  UpdateUserRole(this.role);
}