import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:mycrewmanager/core/tokenhandlers/token_storage.dart';
import 'package:mycrewmanager/features/authentication/domain/entities/user.dart';
import 'package:mycrewmanager/features/authentication/domain/usecases/user_login.dart';
import 'package:mycrewmanager/features/authentication/domain/usecases/user_signup.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final UserLogin _userLogin;
  final UserSignup _userSignup;
  final TokenStorage _tokenStorage;

  AuthBloc({required UserLogin userLogin, required UserSignup userSignup, required TokenStorage tokenStorage})
      : _userLogin = userLogin,
        _userSignup = userSignup,
        _tokenStorage = tokenStorage,
        super(AuthInitial()) {
    on<AuthEvent>((_, emit) => emit(AuthLoading()));
    on<AuthLogin>(_onAuthLogin);
    on<AuthSignUp>(_onAuthSignup);
    on<UpdateUserRole>(_onUpdateUserRole);
  }

  void _onAuthLogin(AuthLogin event, Emitter<AuthState> emit) async {
    logger.d("🔐 Starting login process for: ${event.email}");
    
    final res = await _userLogin(
      UserLoginParams(email: event.email, password: event.password),
    );

    await res.fold(
      (failure) async {
        logger.d("❌ LOGIN FAILED: ${failure.message}");
        emit(AuthFailure(failure.message));
      },
      (user) async {
        logger.d("✅ LOGIN SUCCESS: ${user.name} - Token: ${user.token}");
        await _tokenStorage.saveToken(user.token);
        emit(AuthSuccess(user));
      },
    );
  }

  void _onAuthSignup(AuthSignUp event, Emitter<AuthState> emit) async {
    logger.d("🔐 Starting signup process for: ${event.email}");
    
    final res = await _userSignup(
      UserSignupParams(name: event.name, email: event.email, password: event.password, role: event.role)
    );

    await res.fold(
      (failure) async {
        logger.d("❌ SIGNUP FAILED: ${failure.message}");
        emit(AuthFailure(failure.message));
      },
      (user) async {
        logger.d("✅ SIGNUP SUCCESS: ${user.name} - Token: ${user.token}");
        await _tokenStorage.saveToken(user.token);
        emit(AuthSuccess(user));
      }
    );
  }

  void _onUpdateUserRole(UpdateUserRole event, Emitter<AuthState> emit) {
    // Get the current user from the state
    final currentState = state;
    if (currentState is AuthSuccess) {
      // Create a new user with updated role
      final updatedUser = User(
        id: currentState.user.id,
        email: currentState.user.email,
        name: currentState.user.name,
        token: currentState.user.token,
        role: event.role,
      );
      emit(AuthRoleUpdated(updatedUser));
    }
  }

}
