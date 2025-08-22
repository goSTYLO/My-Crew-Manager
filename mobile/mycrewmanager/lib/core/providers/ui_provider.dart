import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class UiProvider with ChangeNotifier {
  // Example: Track the current selected tab index
  int _selectedTabIndex = 0;

  int get selectedTabIndex => _selectedTabIndex;

  void setSelectedTabIndex(int index) {
    if (_selectedTabIndex != index) {
      _selectedTabIndex = index;
      notifyListeners();
    }
  }

  // Example: Track theme mode (light/dark)
  ThemeMode _themeMode = ThemeMode.system;

  ThemeMode get themeMode => _themeMode;

  void setThemeMode(ThemeMode mode) {
    if (_themeMode != mode) {
      _themeMode = mode;
      notifyListeners();
    }
  }

  // Add more UI-related state and methods as needed
}

class LoginFormState {
  final String email;
  final String password;
  final bool isPasswordVisible;
  final bool isTermsAccepted;
  LoginFormState({
    this.email = '',
    this.password = '',
    this.isPasswordVisible = false,
    this.isTermsAccepted = false,
  });
  bool get isValid => email.isNotEmpty && password.isNotEmpty && isTermsAccepted;
  LoginFormState copyWith({
    String? email,
    String? password,
    bool? isPasswordVisible,
    bool? isTermsAccepted,
  }) => LoginFormState(
    email: email ?? this.email,
    password: password ?? this.password,
    isPasswordVisible: isPasswordVisible ?? this.isPasswordVisible,
    isTermsAccepted: isTermsAccepted ?? this.isTermsAccepted,
  );
}

class LoginFormNotifier extends StateNotifier<LoginFormState> {
  LoginFormNotifier() : super(LoginFormState());
  void updateEmail(String email) => state = state.copyWith(email: email);
  void updatePassword(String password) => state = state.copyWith(password: password);
  void togglePasswordVisibility() => state = state.copyWith(isPasswordVisible: !state.isPasswordVisible);
  void toggleTermsAcceptance() => state = state.copyWith(isTermsAccepted: !state.isTermsAccepted);
}

final loginFormProvider = StateNotifierProvider<LoginFormNotifier, LoginFormState>((ref) => LoginFormNotifier());