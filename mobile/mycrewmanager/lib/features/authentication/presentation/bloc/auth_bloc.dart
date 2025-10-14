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
  }

  void _onAuthLogin(AuthLogin event, Emitter<AuthState> emit) async {
    final res = await _userLogin(
      UserLoginParams(email: event.email, password: event.password),
    );

    // res.fold(
    //   (failure) {
    //     logger.d('Failure: ${failure.runtimeType} - ${failure.message}');
    //     emit(AuthFailure(failure.message));
    //   },
    //   (user) async {
    //     logger.d('TOKEN: ${user.token}');
    //     // ✅ Store the token securely
    //     await _tokenStorage.saveToken(user.token);
    //     _emitAuthSuccess(user, emit);
    //   },
    // );
      await res.fold(
    (failure) async {
      logger.d("FAILED");
      emit(AuthFailure(failure.message));
    },
    (user) async {
      await _tokenStorage.saveToken(user.token);
      emit(AuthSuccess(user)); // no need to wrap in a helper
    },
    );
  }

  void _onAuthSignup(AuthSignUp event, Emitter<AuthState> emit) async {
    final res = await _userSignup(
      UserSignupParams(name: event.name, email: event.email, password: event.password)
    );

    await res.fold(
    (failure) async {
      logger.d("SIGN UP FAILED");
      emit(AuthFailure(failure.message));
    },
    (message) async {
      emit(AuthSuccess(message));
    }
    );
  }

  void _emitAuthSuccess(User user, Emitter<AuthState> emit)  {
    emit(AuthSuccess(user));
  }
}
