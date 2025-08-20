import 'package:flutter/material.dart';
import 'package:sizer/sizer.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/app_export.dart';

class SupportContactWidget extends StatelessWidget {
  const SupportContactWidget({Key? key}) : super(key: key);

  void _contactSupport(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: AppTheme.lightTheme.colorScheme.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.0),
          ),
          title: Text(
            'Contact Support',
            style: GoogleFonts.roboto(
              fontSize: 16.sp,
              fontWeight: FontWeight.w500,
              color: AppTheme.lightTheme.colorScheme.onSurface,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Need immediate assistance? Contact our support team:',
                style: GoogleFonts.roboto(
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w400,
                  color: AppTheme.lightTheme.colorScheme.onSurface
                      .withValues(alpha: 0.7),
                ),
              ),
              SizedBox(height: 2.h),
              Row(
                children: [
                  CustomIconWidget(
                    iconName: 'email',
                    color: AppTheme.lightTheme.primaryColor,
                    size: 18,
                  ),
                  SizedBox(width: 2.w),
                  Text(
                    'support@mycrewmanager.com',
                    style: GoogleFonts.roboto(
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w400,
                      color: AppTheme.lightTheme.primaryColor,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 1.h),
              Row(
                children: [
                  CustomIconWidget(
                    iconName: 'phone',
                    color: AppTheme.lightTheme.primaryColor,
                    size: 18,
                  ),
                  SizedBox(width: 2.w),
                  Text(
                    '+1 (555) 123-4567',
                    style: GoogleFonts.roboto(
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w400,
                      color: AppTheme.lightTheme.primaryColor,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 1.h),
              Text(
                'Available 24/7 for enterprise users',
                style: GoogleFonts.roboto(
                  fontSize: 10.sp,
                  fontWeight: FontWeight.w400,
                  color: AppTheme.lightTheme.colorScheme.onSurface
                      .withValues(alpha: 0.6),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(
                'Close',
                style: GoogleFonts.roboto(
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.lightTheme.primaryColor,
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
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(3.w),
      decoration: BoxDecoration(
        color: AppTheme.lightTheme.colorScheme.surface.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(8.0),
        border: Border.all(
          color: AppTheme.lightTheme.colorScheme.outline.withValues(alpha: 0.3),
          width: 1.0,
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CustomIconWidget(
                iconName: 'help_outline',
                color: AppTheme.lightTheme.colorScheme.onSurface
                    .withValues(alpha: 0.6),
                size: 16,
              ),
              SizedBox(width: 1.w),
              Text(
                'Need Help?',
                style: GoogleFonts.roboto(
                  fontSize: 11.sp,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.lightTheme.colorScheme.onSurface
                      .withValues(alpha: 0.7),
                ),
              ),
            ],
          ),
          SizedBox(height: 1.h),
          Text(
            'If you\'re having trouble accessing your account or didn\'t receive the reset email, our support team is here to help.',
            style: GoogleFonts.roboto(
              fontSize: 10.sp,
              fontWeight: FontWeight.w400,
              color: AppTheme.lightTheme.colorScheme.onSurface
                  .withValues(alpha: 0.6),
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 1.h),
          TextButton(
            onPressed: () => _contactSupport(context),
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.lightTheme.primaryColor,
              padding: EdgeInsets.symmetric(
                horizontal: 3.w,
                vertical: 0.5.h,
              ),
            ),
            child: Text(
              'Contact Support',
              style: GoogleFonts.roboto(
                fontSize: 11.sp,
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