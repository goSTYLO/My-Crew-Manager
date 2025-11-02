import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:mycrewmanager/core/tokenhandlers/token_storage.dart';
import 'package:mycrewmanager/features/authentication/domain/entities/user.dart';
import 'package:mycrewmanager/features/authentication/domain/usecases/user_login.dart';
import 'package:mycrewmanager/features/authentication/domain/usecases/user_signup.dart';
import 'package:mycrewmanager/features/authentication/domain/usecases/user_logout.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:mycrewmanager/init_dependencies.dart' as deps;
import 'package:mycrewmanager/features/chat/data/services/chat_ws_service.dart';
import 'package:mycrewmanager/features/notification/data/services/notification_ws_service.dart';
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
    on<AuthLogin>(_onAuthLogin);
    on<AuthSignUp>(_onAuthSignup);
    on<UpdateUserRole>(_onUpdateUserRole);
    on<AuthLogout>(_onAuthLogout);
    on<AuthIsUserLoggedIn>(_onAuthIsUserLoggedIn);
    on<RefreshUserData>(_onRefreshUserData);
  }

  void _onAuthLogin(AuthLogin event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    
    logger.i('🔐 Login attempt for email: ${event.email}');
    logger.d('📡 Base URL: ${Constants.baseUrl}');
    
    final res = await _userLogin(
      UserLoginParams(email: event.email, password: event.password),
    );

    await res.fold(
      (failure) async {
        logger.e('❌ Login failed: ${failure.message}');
        emit(AuthFailure(failure.message));
      },
      (user) async {
        logger.i('✅ Login successful, saving token and fetching user data...');
        await _tokenStorage.saveToken(user.token);
        
        // Fetch complete user data including profile picture
        try {
          final dio = Dio();
          dio.options.headers['Authorization'] = 'Token ${user.token}';
          dio.options.baseUrl = Constants.baseUrl;
          
          logger.d('📡 Fetching user profile from: ${Constants.baseUrl}user/me/');
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
            
            logger.i('✅ User profile fetched successfully');
            emit(AuthSuccess(completeUser));
          } else {
            logger.w('⚠️ User profile fetch returned status ${response.statusCode}, using basic user data');
            // Fallback to basic user data if complete data fetch fails
            emit(AuthSuccess(user));
          }
        } catch (e, stackTrace) {
          logger.e('❌ Error fetching user profile: $e');
          logger.e('   Stack trace: $stackTrace');
          // Fallback to basic user data if complete data fetch fails
          emit(AuthSuccess(user));
        }
      },
    );
  }

  void _onAuthSignup(AuthSignUp event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    
    final res = await _userSignup(
      UserSignupParams(name: event.name, email: event.email, password: event.password, role: event.role)
    );

    await res.fold(
      (failure) async {
        emit(AuthFailure(failure.message));
      },
      (user) async {
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
            
            emit(AuthSuccess(completeUser));
          } else {
            // Fallback to basic user data if complete data fetch fails
            emit(AuthSuccess(user));
          }
        } catch (e) {
          // Fallback to basic user data if complete data fetch fails
          emit(AuthSuccess(user));
        }
      }
    );
  }

  void _onAuthLogout(AuthLogout event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    
    // Disconnect WebSocket services before logout
    try {
      final chatWsService = deps.serviceLocator<ChatWsService>();
      final notificationWsService = deps.serviceLocator<NotificationWsService>();
      
      await chatWsService.disconnect();
      notificationWsService.disconnect();
      
    } catch (e) {
      // Continue with logout even if WebSocket cleanup fails
    }
    
    final res = await _userLogout(NoParams());

    await res.fold(
      (failure) async {
        emit(AuthFailure(failure.message));
      },
      (_) async {
        await _tokenStorage.clearToken();
        emit(AuthLoggedOut());
      }
    );
  }

  void _onAuthIsUserLoggedIn(AuthIsUserLoggedIn event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    
    final token = await _tokenStorage.getToken();
    
    if (token == null) {
      logger.d('ℹ️ No token found, user is logged out');
      emit(AuthLoggedOut());
      return;
    }
    
    // Try to get user data with the existing token
    try {
      logger.d('🔍 Checking existing token validity...');
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
        
        logger.i('✅ Token is valid, user is authenticated');
        emit(AuthSuccess(user));
      } else {
        logger.w('⚠️ Token validation returned status ${response.statusCode}, clearing token');
        await _tokenStorage.clearToken();
        emit(AuthLoggedOut());
      }
    } catch (e, stackTrace) {
      logger.e('❌ Error validating token: $e');
      logger.e('   Stack trace: $stackTrace');
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

  void _onRefreshUserData(RefreshUserData event, Emitter<AuthState> emit) async {
    
    final currentState = state;
    if (currentState is! AuthSuccess) {
      logger.w('⚠️ Cannot refresh user data - user not authenticated');
      return;
    }

    try {
      logger.d('🔄 Refreshing user data...');
      final dio = Dio();
      dio.options.headers['Authorization'] = 'Token ${currentState.user.token}';
      dio.options.baseUrl = Constants.baseUrl;
      
      final response = await dio.get('user/me/');
      
      if (response.statusCode == 200) {
        final userData = response.data;
        
        final updatedUser = User(
          id: userData['user_id']?.toString() ?? currentState.user.id,
          email: userData['email'] ?? currentState.user.email,
          name: userData['name'] ?? currentState.user.name,
          token: currentState.user.token,
          role: userData['role'] ?? currentState.user.role,
          profilePicture: userData['profile_picture'] ?? currentState.user.profilePicture,
        );
        
        logger.i('✅ User data refreshed successfully');
        emit(AuthSuccess(updatedUser));
      } else {
        logger.w('⚠️ User data refresh returned status ${response.statusCode}, preserving current state');
        // Don't emit anything on failure to preserve current state
      }
    } catch (e, stackTrace) {
      logger.e('❌ Error refreshing user data: $e');
      logger.e('   Stack trace: $stackTrace');
      // Don't emit anything on error to preserve current state
    }
  }

}
