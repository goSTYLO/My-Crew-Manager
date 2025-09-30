import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/core/common/widgets/loader.dart';
import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:mycrewmanager/core/theme/pallete.dart';
import 'package:mycrewmanager/core/utils/show_snackbar.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/forgot_password.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/signup_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/dashboard_page.dart';

class LoginPage extends StatefulWidget {
  static route() => MaterialPageRoute(builder: (context) => const LoginPage());
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;
  bool _acceptedTerms = false;

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() {
    if (formKey.currentState!.validate()) {
      context.read<AuthBloc>().add(
            AuthLogin(
              email: emailController.text.trim(),
              password: passwordController.text.trim(),
            ),
          );
    }
  }

@override
Widget build(BuildContext context) {
  return Scaffold(
    resizeToAvoidBottomInset: true,
    body: BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthFailure) {
          showSnackBar(context, state.message, Colors.red);
        } else if (state is AuthSuccess && ModalRoute.of(context)?.isCurrent == true) {
          showSnackBar(context, "Login Success: ${state.user.token}", Colors.green);
          Navigator.pushReplacement(context, DashboardPage.route());
        }
      },
      builder: (context, state) {
        if (state is AuthLoading) return const Loader();
        return Column(
          children: [
            // Upper section with gradient
            Container(
              height: 275, // Reduced height to fit content
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFFF5F5F5), Color.fromARGB(255, 184, 198, 208)],
                ),
              ),
              child: Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.asset(
                      "lib/core/assets/images/app_logo.png",
                      width: 63,
                      height: 67,
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      "MyCrewManager",
                      style: TextStyle(
                        color: AppPallete.titleColor,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Form section
            Expanded(
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Form(
                    key: formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          "Welcome back!!",
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          "Please enter your details.",
                          style: TextStyle(fontSize: 14, color: Colors.black54),
                        ),
                        const SizedBox(height: 20),
                        TextFormField(
                          controller: emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: _inputDecoration("Email Address"),
                          validator: (value) => value == null || value.isEmpty
                              ? 'Please enter your email'
                              : !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)
                                  ? 'Please enter a valid email address'
                                  : null,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: passwordController,
                          obscureText: _obscurePassword,
                          decoration: _inputDecoration(
                            "Password",
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword ? Icons.visibility_off : Icons.visibility,
                                color: Colors.grey[600],
                              ),
                              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                            ),
                          ),
                          validator: (value) => value == null || value.isEmpty
                              ? 'Please enter your password'
                              : value.length < 6
                                  ? 'Password must be at least 6 characters'
                                  : null,
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Checkbox(
                                  value: _acceptedTerms,
                                  onChanged: (value) => setState(() => _acceptedTerms = value ?? false),
                                  activeColor: AppPallete.black,
                                ),
                                const Text("Terms & Conditions", style: TextStyle(fontSize: 14, color: Colors.black)),
                              ],
                            ),
                            TextButton(
                              onPressed: () => Navigator.push(context, ForgotPasswordPage.route()),
                              child: const Text(
                                "Forgot Password?",
                                style: TextStyle(
                                  color: AppPallete.black,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _acceptedTerms ? _handleLogin : null,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.black,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text("Log in", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text(
                              "Don't have an account? ",
                              style: TextStyle(fontSize: 14, color: AppPallete.black),
                            ),
                            TextButton(
                              onPressed: () => Navigator.push(context, SignUpPage.route()),
                              child: const Text(
                                "Sign up for free",
                                style: TextStyle(
                                  color: AppPallete.black,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  decoration: TextDecoration.underline,
                                  decorationColor: AppPallete.black,
                                  decorationThickness: 1.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    ),
  );
}

InputDecoration _inputDecoration(String hintText, {Widget? suffixIcon}) => InputDecoration(
      hintText: hintText,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Colors.blue),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Colors.red),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      suffixIcon: suffixIcon,
    );
}