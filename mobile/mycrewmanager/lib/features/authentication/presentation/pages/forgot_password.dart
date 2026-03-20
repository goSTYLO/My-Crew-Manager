import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:mycrewmanager/core/constants/constants.dart';

enum ForgotStep { email, otp, password, success }

class ForgotPasswordPage extends StatefulWidget {
  static route() =>
      MaterialPageRoute(builder: (context) => const ForgotPasswordPage());

  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  final _emailFormKey = GlobalKey<FormState>();
  final _otpFormKey = GlobalKey<FormState>();
  final _passwordFormKey = GlobalKey<FormState>();

  ForgotStep _step = ForgotStep.email;
  bool _loading = false;

  Dio get _dio => Dio(BaseOptions(baseUrl: Constants.baseUrl));

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  String _extractError(Object error, {String fallback = 'Request failed'}) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map<String, dynamic>) {
        return (data['detail'] ?? data['error'] ?? data['message'] ?? fallback)
            .toString();
      }
    }
    return fallback;
  }

  void _showMessage(String text, {bool success = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(text),
        backgroundColor: success ? Colors.green : Colors.red,
      ),
    );
  }

  Future<void> _requestOtp() async {
    if (!_emailFormKey.currentState!.validate() || _loading) return;

    setState(() => _loading = true);
    try {
      final response = await _dio.post(
        'user/email/request/',
        data: {'email': _emailController.text.trim()},
      );

      if (!mounted) return;
      if (response.statusCode == 204 || (response.statusCode ?? 500) < 300) {
        setState(() => _step = ForgotStep.otp);
        _showMessage('Verification code sent! Check your email.', success: true);
      }
    } catch (e) {
      if (!mounted) return;
      _showMessage(_extractError(e, fallback: 'Failed to send verification code'));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verifyOtp() async {
    if (!_otpFormKey.currentState!.validate() || _loading) return;

    setState(() => _loading = true);
    try {
      final response = await _dio.post(
        'user/email/verify/',
        data: {
          'email': _emailController.text.trim(),
          'code': _otpController.text.trim(),
        },
      );

      if (!mounted) return;
      final data = response.data;
      final verified = data is Map<String, dynamic> && data['verified'] == true;
      if (verified || (response.statusCode ?? 500) < 300) {
        setState(() => _step = ForgotStep.password);
        _showMessage('Code verified successfully.', success: true);
      }
    } catch (e) {
      if (!mounted) return;
      _showMessage(_extractError(e, fallback: 'Invalid or expired code'));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resetPassword() async {
    if (!_passwordFormKey.currentState!.validate() || _loading) return;

    setState(() => _loading = true);
    try {
      await _dio.post(
        'user/reset-password/',
        data: {
          'email': _emailController.text.trim(),
          'password': _passwordController.text,
          'code': _otpController.text.trim(),
        },
      );

      if (!mounted) return;
      setState(() => _step = ForgotStep.success);
      _showMessage('Password has been reset successfully.', success: true);
    } catch (e) {
      if (!mounted) return;
      _showMessage(_extractError(e, fallback: 'Failed to reset password'));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  InputDecoration _inputDecoration(String labelText, IconData icon) =>
      InputDecoration(
        labelText: labelText,
        labelStyle: TextStyle(color: Colors.grey[600], fontSize: 15),
        prefixIcon: Icon(icon, color: Colors.grey[600]),
        filled: true,
        fillColor: Colors.grey[50],
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[300]!, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[300]!, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.blue, width: 2),
        ),
      );

  Widget _buildEmailStep() {
    return Form(
      key: _emailFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Reset your Password',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 28,
              color: Colors.black87,
              letterSpacing: -0.5,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            "Enter your email and we'll send a verification code.",
            style: TextStyle(fontSize: 15, color: Colors.grey[600], height: 1.5),
          ),
          const SizedBox(height: 32),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: _inputDecoration('Email Address', Icons.email_outlined),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your email address';
              }
              if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                return 'Please enter a valid email address';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _loading ? null : _requestOtp,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(_loading ? 'Sending...' : 'Send OTP'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOtpStep() {
    return Form(
      key: _otpFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Enter Verification Code',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 28, color: Colors.black87),
          ),
          const SizedBox(height: 12),
          Text(
            'A 6-digit code was sent to ${_emailController.text.trim()}.',
            style: TextStyle(fontSize: 15, color: Colors.grey[600], height: 1.5),
          ),
          const SizedBox(height: 32),
          TextFormField(
            controller: _otpController,
            keyboardType: TextInputType.number,
            maxLength: 6,
            decoration: _inputDecoration('Verification Code', Icons.verified_outlined)
                .copyWith(counterText: ''),
            validator: (value) {
              final code = value?.trim() ?? '';
              if (!RegExp(r'^\d{6}$').hasMatch(code)) {
                return 'Enter a valid 6-digit code';
              }
              return null;
            },
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _loading ? null : _verifyOtp,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(_loading ? 'Verifying...' : 'Verify OTP'),
            ),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _loading ? null : _requestOtp,
            child: const Text('Resend OTP'),
          ),
        ],
      ),
    );
  }

  Widget _buildPasswordStep() {
    return Form(
      key: _passwordFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Set New Password',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 28, color: Colors.black87),
          ),
          const SizedBox(height: 12),
          Text(
            'Create a new password for ${_emailController.text.trim()}.',
            style: TextStyle(fontSize: 15, color: Colors.grey[600], height: 1.5),
          ),
          const SizedBox(height: 32),
          TextFormField(
            controller: _passwordController,
            obscureText: true,
            decoration: _inputDecoration('New Password', Icons.lock_outline),
            validator: (value) {
              if (value == null || value.length < 6) {
                return 'Password must be at least 6 characters';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _confirmController,
            obscureText: true,
            decoration: _inputDecoration('Confirm Password', Icons.lock_reset_outlined),
            validator: (value) {
              if (value != _passwordController.text) {
                return 'Passwords do not match';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _loading ? null : _resetPassword,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(_loading ? 'Resetting...' : 'Reset Password'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Password Updated',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 28, color: Colors.black87),
        ),
        const SizedBox(height: 12),
        Text(
          'Your password has been reset successfully. You can now sign in with your new password.',
          style: TextStyle(fontSize: 15, color: Colors.grey[600], height: 1.5),
        ),
        const SizedBox(height: 28),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Back to Sign In'),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        centerTitle: true,
        title: const Text(
          'Forgot Password',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 20),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black87,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Builder(
            builder: (_) {
              switch (_step) {
                case ForgotStep.email:
                  return _buildEmailStep();
                case ForgotStep.otp:
                  return _buildOtpStep();
                case ForgotStep.password:
                  return _buildPasswordStep();
                case ForgotStep.success:
                  return _buildSuccessStep();
              }
            },
          ),
        ),
      ),
    );
  }
}
