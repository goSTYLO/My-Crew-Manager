import 'package:flutter/material.dart';
import 'package:sizer/sizer.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/app_export.dart';
import '../../../theme/app_theme.dart';

class ResetButtonWidget extends StatelessWidget {
  final bool isEnabled;
  final bool isLoading;
  final VoidCallback onPressed;

  const ResetButtonWidget({
    Key? key,
    required this.isEnabled,
    required this.isLoading,
    required this.onPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 6.h,
      constraints: BoxConstraints(
        minHeight: 48,
        maxHeight: 56,
      ),
      child: ElevatedButton(
        onPressed: isEnabled && !isLoading ? onPressed : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: isEnabled
              ? AppTheme.lightTheme.primaryColor
              : AppTheme.lightTheme.colorScheme.outline.withValues(alpha: 0.3),
          foregroundColor: Colors.white,
          disabledBackgroundColor:
              AppTheme.lightTheme.colorScheme.outline.withValues(alpha: 0.3),
          disabledForegroundColor:
              AppTheme.lightTheme.colorScheme.onSurface.withValues(alpha: 0.4),
          elevation: isEnabled ? 2.0 : 0.0,
          shadowColor: AppTheme.lightTheme.colorScheme.shadow,
          padding: EdgeInsets.symmetric(
            horizontal: 6.w,
            vertical: 1.5.h,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8.0),
          ),
        ),
        child: isLoading
            ? SizedBox(
                width: 5.w,
                height: 5.w,
                child: CircularProgressIndicator(
                  strokeWidth: 2.0,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Text(
                'Send Reset Link',
                style: GoogleFonts.roboto(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 1.25,
                ),
              ),
      ),
    );
  }
}