import 'package:flutter/material.dart';
import 'package:mycrewmanager/core/theme/theme.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/splash_screen.dart';

void main() {
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: "MyCrewManager",
      theme: AppTheme.lightThemeMode,
      home: const SplashScreen(),
    );
  }
}
