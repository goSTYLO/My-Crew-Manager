import 'package:flutter/material.dart';
import 'package:sizer/sizer.dart';

import '../../../core/app_export.dart';

class PasswordStrengthIndicatorWidget extends StatelessWidget {
  final String password;

  const PasswordStrengthIndicatorWidget({
    Key? key,
    required this.password,
  }) : super(key: key);

  PasswordStrength _calculateStrength(String password) {
    if (password.isEmpty) return PasswordStrength.none;

    int score = 0;

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character variety checks
    if (password.contains(RegExp(r'[a-z]'))) score++;
    if (password.contains(RegExp(r'[A-Z]'))) score++;
    if (password.contains(RegExp(r'[0-9]'))) score++;
    if (password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) score++;

    // Common patterns penalty
    if (password.toLowerCase().contains('password') ||
        password.toLowerCase().contains('123456') ||
        password.toLowerCase().contains('qwerty')) {
      score = score > 1 ? score - 2 : 0;
    }

    if (score <= 2) return PasswordStrength.weak;
    if (score <= 4) return PasswordStrength.medium;
    return PasswordStrength.strong;
  }

  Color _getStrengthColor(PasswordStrength strength) {
    switch (strength) {
      case PasswordStrength.weak:
        return AppTheme.errorLight;
      case PasswordStrength.medium:
        return AppTheme.warningLight;
      case PasswordStrength.strong:
        return AppTheme.successLight;
      case PasswordStrength.none:
        return AppTheme.lightTheme.colorScheme.outline;
    }
  }

  String _getStrengthText(PasswordStrength strength) {
    switch (strength) {
      case PasswordStrength.weak:
        return 'Weak';
      case PasswordStrength.medium:
        return 'Medium';
      case PasswordStrength.strong:
        return 'Strong';
      case PasswordStrength.none:
        return '';
    }
  }

  double _getStrengthProgress(PasswordStrength strength) {
    switch (strength) {
      case PasswordStrength.weak:
        return 0.33;
      case PasswordStrength.medium:
        return 0.66;
      case PasswordStrength.strong:
        return 1.0;
      case PasswordStrength.none:
        return 0.0;
    }
  }

  List<String> _getPasswordRequirements() {
    List<String> requirements = [];

    if (password.length < 8) {
      requirements.add('At least 8 characters');
    }
    if (!password.contains(RegExp(r'[a-z]'))) {
      requirements.add('One lowercase letter');
    }
    if (!password.contains(RegExp(r'[A-Z]'))) {
      requirements.add('One uppercase letter');
    }
    if (!password.contains(RegExp(r'[0-9]'))) {
      requirements.add('One number');
    }
    if (!password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) {
      requirements.add('One special character');
    }

    return requirements;
  }

  @override
  Widget build(BuildContext context) {
    final strength = _calculateStrength(password);
    final strengthColor = _getStrengthColor(strength);
    final strengthText = _getStrengthText(strength);
    final progress = _getStrengthProgress(strength);
    final requirements = _getPasswordRequirements();

    if (password.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(height: 1.h),
        Row(
          children: [
            Expanded(
              child: Container(
                height: 0.5.h,
                decoration: BoxDecoration(
                  color: AppTheme.lightTheme.colorScheme.outline
                      .withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(0.25.h),
                ),
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: progress,
                  child: Container(
                    decoration: BoxDecoration(
                      color: strengthColor,
                      borderRadius: BorderRadius.circular(0.25.h),
                    ),
                  ),
                ),
              ),
            ),
            SizedBox(width: 3.w),
            Text(
              strengthText,
              style: AppTheme.lightTheme.textTheme.bodySmall?.copyWith(
                color: strengthColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        if (requirements.isNotEmpty) ...[
          SizedBox(height: 1.h),
          ...requirements
              .map((requirement) => Padding(
                    padding: EdgeInsets.only(bottom: 0.5.h),
                    child: Row(
                      children: [
                        CustomIconWidget(
                          iconName: 'circle',
                          color: AppTheme.lightTheme.colorScheme.outline,
                          size: 1.w,
                        ),
                        SizedBox(width: 2.w),
                        Text(
                          requirement,
                          style:
                              AppTheme.lightTheme.textTheme.bodySmall?.copyWith(
                            color: AppTheme
                                .lightTheme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ))
              .toList(),
        ],
      ],
    );
  }
}

enum PasswordStrength {
  none,
  weak,
  medium,
  strong,
}
