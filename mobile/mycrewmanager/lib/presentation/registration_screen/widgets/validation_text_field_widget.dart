import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:sizer/sizer.dart';

import '../../../core/app_export.dart';

class ValidationTextFieldWidget extends StatefulWidget {
  final String label;
  final String hint;
  final TextEditingController controller;
  final String? Function(String?)? validator;
  final TextInputType keyboardType;
  final bool obscureText;
  final Widget? suffixIcon;
  final List<TextInputFormatter>? inputFormatters;
  final int? maxLength;
  final bool showValidationIcon;
  final VoidCallback? onTap;
  final bool readOnly;

  const ValidationTextFieldWidget({
    Key? key,
    required this.label,
    required this.hint,
    required this.controller,
    this.validator,
    this.keyboardType = TextInputType.text,
    this.obscureText = false,
    this.suffixIcon,
    this.inputFormatters,
    this.maxLength,
    this.showValidationIcon = true,
    this.onTap,
    this.readOnly = false,
  }) : super(key: key);

  @override
  State<ValidationTextFieldWidget> createState() =>
      _ValidationTextFieldWidgetState();
}

class _ValidationTextFieldWidgetState extends State<ValidationTextFieldWidget> {
  final FocusNode _focusNode = FocusNode();
  String? _errorText;
  bool _isValid = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_validateField);
    _focusNode.addListener(_onFocusChanged);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_validateField);
    _focusNode.removeListener(_onFocusChanged);
    _focusNode.dispose();
    super.dispose();
  }

  void _validateField() {
    if (widget.validator != null) {
      final error = widget.validator!(widget.controller.text);
      setState(() {
        _errorText = error;
        _isValid = error == null && widget.controller.text.isNotEmpty;
      });
    }
  }

  void _onFocusChanged() {
    if (!_focusNode.hasFocus) {
      _validateField();
    }
  }

  Widget? _buildValidationIcon() {
    if (!widget.showValidationIcon || widget.controller.text.isEmpty) {
      return widget.suffixIcon;
    }

    if (_isValid) {
      return Padding(
        padding: EdgeInsets.only(right: 3.w),
        child: CustomIconWidget(
          iconName: 'check_circle',
          color: AppTheme.successLight,
          size: 6.w,
        ),
      );
    }

    if (_errorText != null) {
      return Padding(
        padding: EdgeInsets.only(right: 3.w),
        child: CustomIconWidget(
          iconName: 'error',
          color: AppTheme.errorLight,
          size: 6.w,
        ),
      );
    }

    return widget.suffixIcon;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8.0),
            border: Border.all(
              color: _errorText != null
                  ? AppTheme.lightTheme.colorScheme.error
                  : _focusNode.hasFocus
                      ? AppTheme.lightTheme.colorScheme.primary
                      : _isValid
                          ? AppTheme.successLight
                          : AppTheme.lightTheme.colorScheme.outline,
              width: _focusNode.hasFocus ? 2.0 : 1.0,
            ),
          ),
          child: TextFormField(
            controller: widget.controller,
            focusNode: _focusNode,
            keyboardType: widget.keyboardType,
            obscureText: widget.obscureText,
            inputFormatters: widget.inputFormatters,
            maxLength: widget.maxLength,
            readOnly: widget.readOnly,
            onTap: widget.onTap,
            decoration: InputDecoration(
              labelText: widget.label,
              hintText: widget.hint,
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              focusedErrorBorder: InputBorder.none,
              contentPadding:
                  EdgeInsets.symmetric(horizontal: 4.w, vertical: 3.h),
              suffixIcon: _buildValidationIcon(),
              counterText: '',
            ),
            style: AppTheme.lightTheme.textTheme.bodyLarge,
          ),
        ),
        if (_errorText != null) ...[
          SizedBox(height: 0.5.h),
          Padding(
            padding: EdgeInsets.only(left: 4.w),
            child: Text(
              _errorText!,
              style: AppTheme.lightTheme.textTheme.bodySmall?.copyWith(
                color: AppTheme.lightTheme.colorScheme.error,
              ),
            ),
          ),
        ],
      ],
    );
  }
}
