import 'package:flutter/material.dart';
import 'package:sizer/sizer.dart';

import '../../../core/app_export.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoAnimationController;
  late Animation<double> _logoScaleAnimation;
  late AnimationController _fadeAnimationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _startSplashSequence();
  }

  void _initializeAnimations() {
    // Logo scale animation
    _logoAnimationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _logoScaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _logoAnimationController,
      curve: Curves.elasticOut,
    ));

    // Fade animation for smooth transition
    _fadeAnimationController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 1.0,
      end: 0.0,
    ).animate(CurvedAnimation(
      parent: _fadeAnimationController,
      curve: Curves.easeInOut,
    ));
  }

  Future<void> _startSplashSequence() async {
    // Start logo animation immediately
    _logoAnimationController.forward();

    // Simulate initialization tasks
    await Future.wait([
      _checkStoredCredentials(),
      _validateSessionTokens(),
      _prepareSecureStorage(),
      _checkBiometricAvailability(),
      _verifyApiConnectivity(),
      Future.delayed(const Duration(milliseconds: 2500)), // Minimum splash time
    ]);

    // Start fade out animation
    await _fadeAnimationController.forward();

    // Navigate based on authentication state
    _navigateToNextScreen();
  }

  Future<void> _checkStoredCredentials() async {
    // Simulate checking stored credentials
    await Future.delayed(const Duration(milliseconds: 300));
  }

  Future<void> _validateSessionTokens() async {
    // Simulate session token validation
    await Future.delayed(const Duration(milliseconds: 400));
  }

  Future<void> _prepareSecureStorage() async {
    // Simulate secure storage preparation
    await Future.delayed(const Duration(milliseconds: 200));
  }

  Future<void> _checkBiometricAvailability() async {
    // Simulate biometric authentication setup
    await Future.delayed(const Duration(milliseconds: 250));
  }

  Future<void> _verifyApiConnectivity() async {
    // Simulate API connectivity check
    await Future.delayed(const Duration(milliseconds: 350));
  }

  void _navigateToNextScreen() {
    // For demo purposes, navigate to login screen
    // In real implementation, this would check authentication state
    Navigator.pushReplacementNamed(context, '/login-screen');
  }

  @override
  void dispose() {
    _logoAnimationController.dispose();
    _fadeAnimationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightTheme.scaffoldBackgroundColor,
      body: AnimatedBuilder(
        animation: _fadeAnimation,
        builder: (context, child) {
          return Opacity(
            opacity: _fadeAnimation.value,
            child: SafeArea(
              child: Container(
                width: 100.w,
                height: 100.h,
                decoration: BoxDecoration(
                  color: AppTheme.lightTheme.scaffoldBackgroundColor,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Spacer to push content to center
                    const Spacer(flex: 2),

                    // Animated Logo Section
                    AnimatedBuilder(
                      animation: _logoScaleAnimation,
                      builder: (context, child) {
                        return Transform.scale(
                          scale: _logoScaleAnimation.value,
                          child: _buildLogoSection(),
                        );
                      },
                    ),

                    SizedBox(height: 4.h),

                    // App Name
                    Text(
                      'MyCrewManager',
                      style: AppTheme.lightTheme.textTheme.headlineMedium
                          ?.copyWith(
                        color: AppTheme.lightTheme.colorScheme.onSurface,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                      textAlign: TextAlign.center,
                    ),

                    SizedBox(height: 1.h),

                    // Tagline
                    Text(
                      'Professional Crew Management',
                      style: AppTheme.lightTheme.textTheme.bodyMedium?.copyWith(
                        color: AppTheme.lightTheme.colorScheme.onSurface
                            .withValues(alpha: 0.7),
                        letterSpacing: 0.3,
                      ),
                      textAlign: TextAlign.center,
                    ),

                    const Spacer(flex: 2),

                    // Loading Indicator
                    _buildLoadingIndicator(),

                    SizedBox(height: 6.h),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildLogoSection() {
    return Container(
      width: 25.w,
      height: 25.w,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppTheme.lightTheme.colorScheme.primary,
        boxShadow: [
          BoxShadow(
            color:
                AppTheme.lightTheme.colorScheme.primary.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
            spreadRadius: 2,
          ),
        ],
      ),
      child: Center(
        child: CustomIconWidget(
          iconName: 'person',
          color: AppTheme.lightTheme.colorScheme.onPrimary,
          size: 12.w,
        ),
      ),
    );
  }

  Widget _buildLoadingIndicator() {
    return SizedBox(
      width: 6.w,
      height: 6.w,
      child: CircularProgressIndicator(
        strokeWidth: 2.0,
        valueColor: AlwaysStoppedAnimation<Color>(
          AppTheme.lightTheme.colorScheme.primary,
        ),
        backgroundColor:
            AppTheme.lightTheme.colorScheme.primary.withValues(alpha: 0.2),
      ),
    );
  }
}
