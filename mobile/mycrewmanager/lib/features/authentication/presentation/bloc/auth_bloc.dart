import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:mycrewmanager/core/tokenhandlers/token_storage.dart';
import 'package:mycrewmanager/features/authentication/domain/entities/user.dart';
import 'package:mycrewmanager/features/authentication/domain/usecases/user_login.dart';
import 'package:mycrewmanager/features/authentication/domain/usecases/user_signup.dart';
import 'package:mycrewmanager/features/authentication/domain/usecases/user_logout.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:dio/dio.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final UserLogin _userLogin;
  final UserSignup _userSignup;
  final UserLogout _userLogout;
  final TokenStorage _tokenStorage;

  AuthBloc({required UserLogin userLogin, required UserSignup userSignup, required UserLogout userLogout, required TokenStorage tokenStorage})
      : _userLogin = userLogin,
        _userSignup = userSignup,
        _userLogout = userLogout,
        _tokenStorage = tokenStorage,
        super(AuthInitial()) {
    on<AuthEvent>((_, emit) => emit(AuthLoading()));
    on<AuthLogin>(_onAuthLogin);
    on<AuthSignUp>(_onAuthSignup);
    on<UpdateUserRole>(_onUpdateUserRole);
    on<AuthLogout>(_onAuthLogout);
    on<AuthIsUserLoggedIn>(_onAuthIsUserLoggedIn);
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
        
        // Fetch complete user data including profile picture
        try {
          final dio = Dio();
          dio.options.headers['Authorization'] = 'Token ${user.token}';
          dio.options.baseUrl = Constants.baseUrl;
          
          final response = await dio.get('user/me/');
          
          if (response.statusCode == 200) {
            final userData = response.data;
            final completeUser = User(
              id: userData['user_id']?.toString() ?? user.id,
              email: userData['email'] ?? user.email,
              name: userData['name'] ?? user.name,
              token: user.token,
              role: userData['role'] ?? user.role,
              profilePicture: userData['profile_picture'],
            );
            
            logger.d("✅ Complete user data loaded: ${completeUser.name}");
            emit(AuthSuccess(completeUser));
          } else {
            // Fallback to basic user data if complete data fetch fails
            logger.d("⚠️ Could not fetch complete user data, using basic data");
            emit(AuthSuccess(user));
          }
        } catch (e) {
          // Fallback to basic user data if complete data fetch fails
          logger.d("⚠️ Error fetching complete user data: $e, using basic data");
          emit(AuthSuccess(user));
        }
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
        
        // Fetch complete user data including profile picture
        try {
          final dio = Dio();
          dio.options.headers['Authorization'] = 'Token ${user.token}';
          dio.options.baseUrl = Constants.baseUrl;
          
          final response = await dio.get('user/me/');
          
          if (response.statusCode == 200) {
            final userData = response.data;
            final completeUser = User(
              id: userData['user_id']?.toString() ?? user.id,
              email: userData['email'] ?? user.email,
              name: userData['name'] ?? user.name,
              token: user.token,
              role: userData['role'] ?? user.role,
              profilePicture: userData['profile_picture'],
            );
            
            logger.d("✅ Complete user data loaded: ${completeUser.name}");
            emit(AuthSuccess(completeUser));
          } else {
            // Fallback to basic user data if complete data fetch fails
            logger.d("⚠️ Could not fetch complete user data, using basic data");
            emit(AuthSuccess(user));
          }
        } catch (e) {
          // Fallback to basic user data if complete data fetch fails
          logger.d("⚠️ Error fetching complete user data: $e, using basic data");
          emit(AuthSuccess(user));
        }
      }
    );
  }

  void _onAuthLogout(AuthLogout event, Emitter<AuthState> emit) async {
    logger.d("🔐 Starting logout process");
    
    final res = await _userLogout(NoParams());

    await res.fold(
      (failure) async {
        logger.d("❌ LOGOUT FAILED: ${failure.message}");
        emit(AuthFailure(failure.message));
      },
      (_) async {
        logger.d("✅ LOGOUT SUCCESS");
        await _tokenStorage.clearToken();
        emit(AuthLoggedOut());
      }
    );
  }

  void _onAuthIsUserLoggedIn(AuthIsUserLoggedIn event, Emitter<AuthState> emit) async {
    logger.d("🔍 Checking if user is already logged in");
    
    final token = await _tokenStorage.getToken();
    
    if (token == null) {
      logger.d("❌ No token found, user not logged in");
      emit(AuthLoggedOut());
      return;
    }
    
    // Try to get user data with the existing token
    try {
      final dio = Dio();
      dio.options.headers['Authorization'] = 'Token $token';
      dio.options.baseUrl = Constants.baseUrl;
      
      final response = await dio.get('user/me/');
      
      if (response.statusCode == 200) {
        final userData = response.data;
        final user = User(
          id: userData['user_id']?.toString() ?? '',
          email: userData['email'] ?? '',
          name: userData['name'] ?? '',
          token: token,
          role: userData['role'],
          profilePicture: userData['profile_picture'],
        );
        
        logger.d("✅ User already logged in: ${user.name}");
        emit(AuthSuccess(user));
      } else {
        logger.d("❌ Token invalid, clearing token");
        await _tokenStorage.clearToken();
        emit(AuthLoggedOut());
      }
    } catch (e) {
      logger.d("❌ Error checking user status: $e");
      await _tokenStorage.clearToken();
      emit(AuthLoggedOut());
    }
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
      emit(AuthSuccess(updatedUser));
    }
  }

}
