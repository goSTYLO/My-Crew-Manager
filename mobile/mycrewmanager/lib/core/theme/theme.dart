import 'package:flutter/material.dart';
import 'package:mycrewmanager/core/theme/pallete.dart';

class AppTheme {
  static _border([Color color = AppPallete.borderColor]) => OutlineInputBorder(
      borderSide: BorderSide(color: color, width: 3),
      borderRadius: BorderRadius.circular(10));

  static final darkThemeMode = ThemeData.dark().copyWith(
    scaffoldBackgroundColor: AppPallete.backgroundColor,
    appBarTheme: const AppBarTheme(backgroundColor: AppPallete.backgroundColor),
    chipTheme: const ChipThemeData(
        color: WidgetStatePropertyAll(AppPallete.backgroundColor),
        side: BorderSide.none),
    inputDecorationTheme: InputDecorationTheme(
      contentPadding: const EdgeInsets.all(27),
      border: _border(),
      enabledBorder: _border(),
      focusedBorder: _border(AppPallete.gradient2),
      errorBorder: _border(AppPallete.errorColor),
    ),
  );

  static final lightThemeMode = ThemeData.light().copyWith(
    scaffoldBackgroundColor: const Color.fromARGB(255, 255, 255, 255),
    appBarTheme:
        const AppBarTheme(backgroundColor: AppPallete.backgroundColorLight),
    chipTheme: const ChipThemeData(
        color: WidgetStatePropertyAll(AppPallete.backgroundColor),
        side: BorderSide.none),
    inputDecorationTheme: InputDecorationTheme(
      contentPadding: const EdgeInsets.all(27),
      border: _border(),
      enabledBorder: _border(),
      focusedBorder: _border(const Color.fromARGB(255, 20, 32, 118)),
      errorBorder: _border(AppPallete.errorColor),
    ),
  );
}
