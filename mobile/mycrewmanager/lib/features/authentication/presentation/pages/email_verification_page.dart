import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/login_page.dart';

class EmailVerificationPage extends StatefulWidget {
  static route({required String email}) => MaterialPageRoute(
    builder: (context) => EmailVerificationPage(email: email),
  );

  final String email;

  const EmailVerificationPage({super.key, required this.email});

  @override
  State<EmailVerificationPage> createState() => _EmailVerificationPageState();
}

class _EmailVerificationPageState extends State<EmailVerificationPage> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();
  bool _isSending = false;
  bool _isVerifying = false;

  @override
  void initState() {
    super.initState();
    _requestCode(initial: true);
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _requestCode({bool initial = false}) async {
    if (_isSending) return;

    setState(() {
      _isSending = true;
    });

    try {
      final dio = Dio(BaseOptions(baseUrl: Constants.baseUrl));
      final response = await dio.post(
        'user/email/request/',
        data: {'email': widget.email.trim()},
      );

      if (!mounted) return;

      if (response.statusCode == 204 || (response.statusCode ?? 500) < 300) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              initial
                  ? 'Verification code sent to ${widget.email}'
                  : 'New verification code sent',
            ),
            backgroundColor: Colors.green,
          ),
        );
      }
    } on DioException catch (e) {
      if (!mounted) return;
      final data = e.response?.data;
      final message = data is Map<String, dynamic>
          ? (data['detail'] ?? data['error'] ?? data['message'] ?? 'Failed to send verification code').toString()
          : 'Failed to send verification code';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
        });
      }
    }
  }

  Future<void> _handleVerifyCode() async {
    if (!_formKey.currentState!.validate() || _isVerifying) return;

    setState(() {
      _isVerifying = true;
    });

    try {
      final dio = Dio(BaseOptions(baseUrl: Constants.baseUrl));
      final response = await dio.post(
        'user/email/verify/',
        data: {
          'email': widget.email.trim(),
          'code': _codeController.text.trim(),
        },
      );

      if (!mounted) return;

      final data = response.data;
      final verified = data is Map<String, dynamic> && data['verified'] == true;

      if (verified || (response.statusCode ?? 500) < 300) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Email verified successfully. Please sign in.'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pushAndRemoveUntil(
          context,
          LoginPage.route(),
          (route) => false,
        );
      }
    } on DioException catch (e) {
      if (!mounted) return;
      final data = e.response?.data;
      final message = data is Map<String, dynamic>
          ? (data['detail'] ?? data['error'] ?? data['message'] ?? 'Verification failed').toString()
          : 'Verification failed';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isVerifying = false;
        });
      }
    }
  }

  void _handleResendCode() {
    _requestCode();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        centerTitle: true,
        title: const Text('Verify Email'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black87,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Enter Verification Code',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 28,
                    color: Colors.black87,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'We sent a 6-digit code to ${widget.email}.',
                  style: TextStyle(
                    fontSize: 15,
                    color: Colors.grey[700],
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _codeController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  decoration: InputDecoration(
                    labelText: 'Verification Code',
                    counterText: '',
                    prefixIcon: const Icon(Icons.mark_email_read_outlined),
                    filled: true,
                    fillColor: Colors.grey[50],
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                  ),
                  validator: (value) {
                    final code = value?.trim() ?? '';
                    if (code.isEmpty) {
                      return 'Please enter the verification code';
                    }
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
                    onPressed: _isVerifying ? null : _handleVerifyCode,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      _isVerifying ? 'Verifying...' : 'Verify Account',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _isSending ? null : _handleResendCode,
                  child: Text(_isSending ? 'Sending...' : 'Resend code'),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () {
                    Navigator.pushAndRemoveUntil(
                      context,
                      LoginPage.route(),
                      (route) => false,
                    );
                  },
                  child: const Text('Back to Sign In'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}