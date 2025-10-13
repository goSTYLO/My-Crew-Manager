import 'package:flutter/material.dart';
import '../presentation/login_screen/login_screen.dart';
import '../presentation/splash_screen/splash_screen.dart';
import '../presentation/forgot_password_screen/forgot_password_screen.dart';
import '../presentation/registration_screen/registration_screen.dart';

class AppRoutes {
  static const String initial = '/login'; // Set initial route to login
  static const String login = '/login';
  static const String splash = '/splash-screen';
  static const String forgotPassword = '/forgot-password-screen';
  static const String registration = '/registration-screen';

  static Map<String, WidgetBuilder> routes = {
    login: (context) => const LoginScreen(),
    splash: (context) => const SplashScreen(),
    forgotPassword: (context) => const ForgotPasswordScreen(),
    registration: (context) => const RegistrationScreen(),
    // Add other routes here
  };
}