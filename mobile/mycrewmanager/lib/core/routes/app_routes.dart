import 'package:flutter/material.dart';
// import '../presentation/login_screen/login_screen.dart';
// import '../presentation/splash_screen/splash_screen.dart';
// import '../presentation/forgot_password_screen/forgot_password_screen.dart';
// import '../presentation/registration_screen/registration_screen.dart';
// import '../presentation/task_dashboard_screen/task_dashboard_screen.dart';

import '/features/authentication/presentation/pages/login_screen/login_screen.dart';
import '/features/authentication/presentation/pages/splash_screen/splash_screen.dart';
import '/features/authentication/presentation/pages/forgot_password_screen/forgot_password_screen.dart';
import '/features/authentication/presentation/pages/registration_screen/registration_screen.dart';
import '/features/dashboard/presentation/pages/task_dashboard_screen/task_dashboard_screen.dart';

class AppRoutes {
  static const String initial = '/splash-screen'; // Start at splash screen
  static const String login = '/login';
  static const String splash = '/splash-screen';
  static const String forgotPassword = '/forgot-password-screen';
  static const String registration = '/registration-screen';
  static const String taskDashboard = '/task-dashboard-screen';

  static Map<String, WidgetBuilder> routes = {
    login: (context) => const LoginScreen(),
    splash: (context) => const SplashScreen(),
    forgotPassword: (context) => const ForgotPasswordScreen(),
    registration: (context) => const RegistrationScreen(),
    taskDashboard: (context) => const TaskDashboardScreen(),
    // Add other routes here
  };
}