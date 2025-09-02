import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/core/common/cubits/app_user/app_user_cubit.dart';
import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:mycrewmanager/core/common/entities/user.dart';
import 'package:mycrewmanager/features/authentication/domain/usecases/current_user.dart';
import 'package:mycrewmanager/features/authentication/domain/usecases/user_login.dart';
import 'package:mycrewmanager/features/authentication/domain/usecases/user_sign_up.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final UserSignUp _userSignUp;
  final UserLogin _userLogin;
  final CurrentUser _currentUser;
  final AppUserCubit _appUserCubit;

  AuthBloc({
    required UserSignUp userSignUp,
    required UserLogin userLogin,
    required CurrentUser currentUser,
    required AppUserCubit appUserCubit,
  })  : _userSignUp = userSignUp,
        _userLogin = userLogin,
        _currentUser = currentUser,
        _appUserCubit = appUserCubit,
        super(AuthInitial()) {
    on<AuthEvent>((_, emit) => emit(AuthLoading()));
    on<AuthSignUp>(_onAuthSignUp);
    on<AuthLogin>(_onAuthLogin);
    on<AuthIsUserLoggedIn>(_isUserLoggedIn);
  }

  void _isUserLoggedIn(
    AuthIsUserLoggedIn event,
    Emitter<AuthState> emit,
  ) async {
    final res = await _currentUser(NoParams());

    res.fold(
      (l) => emit(AuthFailure(l.message)),
      (r) {
        logger.d('ID: ${r.id}');
        logger.d('Name: ${r.name}');
        logger.d('Email: ${r.email}');
        // emit(AuthSuccess(r));
        _emitAuthSuccess(r, emit);
      },
    );
  }

  void _onAuthSignUp(AuthSignUp event, Emitter<AuthState> emit) async {
    final res = await _userSignUp(
      UserSignUpParams(
        email: event.email,
        name: event.name,
        password: event.password,
      ),
    );

    res.fold(
      (failure) {
        logger.d('Failure: ${failure.runtimeType} - ${failure.message}');
        emit(AuthFailure(failure.message));
      },
      (user) {
        logger.d('Success: $user');
        // emit(AuthSuccess(user));
        _emitAuthSuccess(user, emit);
      },
    );
  }

  void _onAuthLogin(AuthLogin event, Emitter<AuthState> emit) async {
    final res = await _userLogin(
      UserLoginParams(email: event.email, password: event.password),
    );

    res.fold(
      (failure) {
        logger.d('Failure: ${failure.runtimeType} - ${failure.message}');
        emit(AuthFailure(failure.message));
      },
      (user) {
        logger.d('Success: $user');
        // emit(AuthSuccess(user));
        _emitAuthSuccess(user, emit);
      },
    );
  }

  void _emitAuthSuccess(
    User user,
    Emitter<AuthState> emit,
  ) {
    _appUserCubit.updateUser(user);
    emit(AuthSuccess(user));
  }
}
