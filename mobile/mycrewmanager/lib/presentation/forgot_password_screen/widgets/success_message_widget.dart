import 'package:flutter/material.dart';
import 'package:sizer/sizer.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/app_export.dart';

class SuccessMessageWidget extends StatefulWidget {
  final String email;
  final VoidCallback onResend;

  const SuccessMessageWidget({
    Key? key,
    required this.email,
    required this.onResend,
  }) : super(key: key);

  @override
  State<SuccessMessageWidget> createState() => _SuccessMessageWidgetState();
}

class _SuccessMessageWidgetState extends State<SuccessMessageWidget> {
  int _countdown = 60;
  bool _canResend = false;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  void _startCountdown() {
    setState(() {
      _countdown = 60;
      _canResend = false;
    });

    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) {
        setState(() {
          _countdown--;
          if (_countdown <= 0) {
            _canResend = true;
          }
        });
        return _countdown > 0;
      }
      return false;
    });
  }

  void _handleResend() {
    if (_canResend) {
      widget.onResend();
      _startCountdown();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(4.w),
      decoration: BoxDecoration(
        color: AppTheme.lightTheme.colorScheme.surface,
        borderRadius: BorderRadius.circular(12.0),
        border: Border.all(
          color: AppTheme.successLight.withValues(alpha: 0.3),
          width: 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 12.w,
            height: 12.w,
            decoration: BoxDecoration(
              color: AppTheme.successLight.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: CustomIconWidget(
              iconName: 'check_circle',
              color: AppTheme.successLight,
              size: 24,
            ),
          ),
          SizedBox(height: 2.h),
          Text(
            'Reset Link Sent!',
            style: GoogleFonts.roboto(
              fontSize: 16.sp,
              fontWeight: FontWeight.w500,
              color: AppTheme.lightTheme.colorScheme.onSurface,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 1.h),
          Text(
            'We\'ve sent a password reset link to:',
            style: GoogleFonts.roboto(
              fontSize: 12.sp,
              fontWeight: FontWeight.w400,
              color: AppTheme.lightTheme.colorScheme.onSurface
                  .withValues(alpha: 0.7),
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 0.5.h),
          Text(
            widget.email,
            style: GoogleFonts.roboto(
              fontSize: 13.sp,
              fontWeight: FontWeight.w500,
              color: AppTheme.lightTheme.primaryColor,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 2.h),
          Text(
            'The link will arrive within 2-5 minutes. Please check your spam folder if you don\'t see it in your inbox.',
            style: GoogleFonts.roboto(
              fontSize: 11.sp,
              fontWeight: FontWeight.w400,
              color: AppTheme.lightTheme.colorScheme.onSurface
                  .withValues(alpha: 0.6),
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 2.h),
          TextButton(
            onPressed: _canResend ? _handleResend : null,
            style: TextButton.styleFrom(
              foregroundColor: _canResend
                  ? AppTheme.lightTheme.primaryColor
                  : AppTheme.lightTheme.colorScheme.onSurface
                      .withValues(alpha: 0.4),
              padding: EdgeInsets.symmetric(
                horizontal: 4.w,
                vertical: 1.h,
              ),
            ),
            child: Text(
              _canResend ? 'Resend Link' : 'Resend in ${_countdown}s',
              style: GoogleFonts.roboto(
                fontSize: 12.sp,
                fontWeight: FontWeight.w500,
                letterSpacing: 1.25,
              ),
            ),
          ),
        ],
      ),
    );
  }
}