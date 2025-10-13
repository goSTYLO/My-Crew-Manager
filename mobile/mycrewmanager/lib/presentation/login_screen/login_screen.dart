import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:sizer/sizer.dart';

import '../../core/app_export.dart';
import './widgets/app_logo_widget.dart';
import './widgets/bottom_links_widget.dart';
import './widgets/login_form_widget.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isLoading = false;
  int _failedAttempts = 0;
  bool _isAccountLocked = false;
  DateTime? _lockoutTime;

  // Mock credentials for demonstration
  final List<Map<String, String>> _validCredentials = [
    {
      "email": "manager@crewmanager.com",
      "password": "manager123",
      "role": "Manager"
    },
    {
      "email": "supervisor@crewmanager.com",
      "password": "super123",
      "role": "Supervisor"
    },
    {"email": "admin@crewmanager.com", "password": "admin123", "role": "Admin"},
  ];

  @override
  void initState() {
    super.initState();
    _checkAccountLockStatus();
  }

  void _checkAccountLockStatus() {
    if (_lockoutTime != null) {
      final now = DateTime.now();
      final lockoutDuration = now.difference(_lockoutTime!);

      if (lockoutDuration.inMinutes >= 15) {
        setState(() {
          _isAccountLocked = false;
          _failedAttempts = 0;
          _lockoutTime = null;
        });
      }
    }
  }

  Future<void> _handleLogin(String email, String password) async {
    if (_isAccountLocked) {
      _showErrorMessage(
          'Account temporarily locked. Please try again in 15 minutes.');
      return;
    }

    setState(() {
      _isLoading = true;
    });

    // Simulate API call delay
    await Future.delayed(const Duration(seconds: 2));

    // Check credentials
    final isValidCredential = _validCredentials.any((cred) =>
        (cred["email"] as String).toLowerCase() == email.toLowerCase() &&
        cred["password"] == password);

    if (isValidCredential) {
      // Reset failed attempts on successful login
      setState(() {
        _failedAttempts = 0;
        _isAccountLocked = false;
        _lockoutTime = null;
        _isLoading = false;
      });

      // Provide haptic feedback
      HapticFeedback.lightImpact();

      // Show success message
      Fluttertoast.showToast(
        msg: "Login successful! Welcome to MyCrewManager",
        toastLength: Toast.LENGTH_SHORT,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: AppTheme.lightTheme.colorScheme.primary,
        textColor: AppTheme.lightTheme.colorScheme.onPrimary,
        fontSize: 14.sp,
      );

      // Navigate to dashboard (simulated)
      await Future.delayed(const Duration(milliseconds: 500));
      if (mounted) {
        // In a real app, this would navigate to the dashboard
        _showSuccessDialog();
      }
    } else {
      setState(() {
        _failedAttempts++;
        _isLoading = false;
      });

      if (_failedAttempts >= 3) {
        setState(() {
          _isAccountLocked = true;
          _lockoutTime = DateTime.now();
        });
        _showErrorMessage(
            'Too many failed attempts. Account locked for 15 minutes.');
      } else {
        final remainingAttempts = 3 - _failedAttempts;
        _showErrorMessage(
            'Invalid credentials. $remainingAttempts attempts remaining.');
      }
    }
  }

  void _showErrorMessage(String message) {
    Fluttertoast.showToast(
      msg: message,
      toastLength: Toast.LENGTH_LONG,
      gravity: ToastGravity.BOTTOM,
      backgroundColor: AppTheme.lightTheme.colorScheme.error,
      textColor: AppTheme.lightTheme.colorScheme.onError,
      fontSize: 14.sp,
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Row(
            children: [
              CustomIconWidget(
                iconName: 'check_circle',
                color: AppTheme.lightTheme.colorScheme.primary,
                size: 6.w,
              ),
              SizedBox(width: 2.w),
              Text(
                'Login Successful',
                style: TextStyle(
                  fontSize: 18.sp,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.lightTheme.colorScheme.onSurface,
                ),
              ),
            ],
          ),
          content: Text(
            'Welcome to MyCrewManager! You have successfully logged in and will be redirected to your dashboard.',
            style: TextStyle(
              fontSize: 14.sp,
              color: AppTheme.lightTheme.colorScheme.onSurface,
              height: 1.5,
            ),
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                // In a real app, navigate to dashboard here
              },
              child: Text(
                'Continue',
                style: TextStyle(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightTheme.scaffoldBackgroundColor,
      body: SafeArea(
        child: GestureDetector(
          onTap: () => FocusScope.of(context).unfocus(),
          child: SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: MediaQuery.of(context).size.height -
                    MediaQuery.of(context).padding.top -
                    MediaQuery.of(context).padding.bottom,
              ),
              child: IntrinsicHeight(
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 6.w),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      SizedBox(height: 8.h),

                      // App Logo
                      const AppLogoWidget(),

                      SizedBox(height: 4.h),

                      // App Title
                      Text(
                        'MyCrewManager',
                        style: TextStyle(
                          fontSize: 24.sp,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.lightTheme.colorScheme.onSurface,
                          letterSpacing: 0.5,
                        ),
                      ),

                      SizedBox(height: 1.h),

                      // Subtitle
                      Text(
                        'Professional Crew Management',
                        style: TextStyle(
                          fontSize: 14.sp,
                          color:
                              AppTheme.lightTheme.colorScheme.onSurfaceVariant,
                          fontWeight: FontWeight.w400,
                        ),
                      ),

                      SizedBox(height: 6.h),

                      // Account Lockout Warning
                      if (_isAccountLocked) ...[
                        Container(
                          width: double.infinity,
                          padding: EdgeInsets.all(3.w),
                          decoration: BoxDecoration(
                            color: AppTheme.lightTheme.colorScheme.error
                                .withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8.0),
                            border: Border.all(
                              color: AppTheme.lightTheme.colorScheme.error
                                  .withValues(alpha: 0.3),
                              width: 1.0,
                            ),
                          ),
                          child: Row(
                            children: [
                              CustomIconWidget(
                                iconName: 'warning',
                                color: AppTheme.lightTheme.colorScheme.error,
                                size: 5.w,
                              ),
                              SizedBox(width: 2.w),
                              Expanded(
                                child: Text(
                                  'Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.',
                                  style: TextStyle(
                                    fontSize: 12.sp,
                                    color:
                                        AppTheme.lightTheme.colorScheme.error,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(height: 3.h),
                      ],

                      // Login Form
                      LoginFormWidget(
                        onLogin: _handleLogin,
                        isLoading: _isLoading,
                      ),

                      const Spacer(),

                      // Bottom Links
                      BottomLinksWidget(isLoading: _isLoading),

                      SizedBox(height: 4.h),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
