import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:mycrewmanager/core/utils/show_snackbar.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/features/authentication/presentation/widgets/auth_gradient_button.dart';
import 'package:mycrewmanager/features/authentication/presentation/widgets/custom_text_field.dart';
import 'package:mycrewmanager/features/authentication/presentation/widgets/photo_picker.dart';
import 'package:mycrewmanager/features/authentication/presentation/widgets/custom_checkbox.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/login_page.dart';

class SignUpPage extends StatefulWidget {
  static route() => MaterialPageRoute(builder: (context) => const SignUpPage());

  const SignUpPage({super.key});

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final _formKey = GlobalKey<FormState>();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _acceptedTerms = false;
  File? _selectedImage;

  // Controllers
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _companyController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _companyController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _onImageSelected(File image) {
    setState(() {
      _selectedImage = image;
    });
  }

  void _togglePasswordVisibility() {
    setState(() {
      _obscurePassword = !_obscurePassword;
    });
  }

  void _onCreateAccountPressed() {
    if (_formKey.currentState!.validate() && _acceptedTerms) {
      context.read<AuthBloc>().add(
        AuthSignUp(
          name: _fullNameController.text,
          email: _emailController.text, 
          password: _passwordController.text
          )
      );
    } else if (!_acceptedTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please accept the terms and conditions'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _navigateToLogin() {
    Navigator.pushReplacement(context, LoginPage.route());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (context, state) {
          if(state is AuthFailure) {
            logger.d(state.message);
            showSnackBar(context, "Something went wrong. Try Again!", Colors.red);
          } else if (state is AuthSuccess) {
            if (ModalRoute.of(context)?.isCurrent ?? false) {
              showSnackBar(context, "Signed in Successfully", Colors.green);
              Navigator.pushReplacement(context, LoginPage.route());
            }
          }
        },
        builder: (context, state) {
          return SingleChildScrollView(
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  // Top section with light grey background
                  Container(
                    width: double.infinity,
                    color: Colors.grey[100],
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    child: Column(
                      children: [
                        // Photo picker
                        PhotoPicker(
                          selectedImage: _selectedImage,
                          onImageSelected: _onImageSelected,
                          size: 120,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _selectedImage != null
                              ? 'Profile photo added successfully!'
                              : 'Tap to add your profile photo',
                          style: TextStyle(
                            color: _selectedImage != null
                                ? Colors.green[600]
                                : Colors.grey[600],
                            fontSize: 14,
                            fontWeight: _selectedImage != null
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),

                  // Main content area
                  Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 30),
                        CustomTextField(
                            hintText: "Full Name",
                            controller: _fullNameController,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return "Full Name is missing!";
                              }
                              if (value.trim().split(' ').length < 2) {
                                return "Please enter your full name (first and last name)!";
                              }
                              return null;
                            }),

                        const SizedBox(height: 16),
                        // Email Address
                        CustomTextField(
                            hintText: "Email Address",
                            controller: _emailController,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return "Email Address is missing!";
                              }
                              if (!RegExp(
                                r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$',
                              ).hasMatch(value)) {
                                return "Please enter a valid email address!";
                              }
                              return null;
                            }),

                        const SizedBox(height: 16),

                        // Password with visibility toggle
                        CustomTextField(
                            hintText: "Password",
                            controller: _passwordController,
                            isObscureText: _obscurePassword,
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_off
                                    : Icons.visibility,
                                color: Colors.grey[600],
                              ),
                              onPressed: _togglePasswordVisibility,
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return "Password is missing!";
                              }
                              if (value.length < 6) {
                                return "Password must be at least 6 characters!";
                              }
                              return null;
                            }),

                        const SizedBox(height: 16),

                        // Confirm Password with visibility toggle
                        CustomTextField(
                            hintText: "Confirm Password",
                            controller: _confirmPasswordController,
                            isObscureText: _obscureConfirmPassword,
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscureConfirmPassword
                                    ? Icons.visibility_off
                                    : Icons.visibility,
                                color: Colors.grey[600],
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscureConfirmPassword = !_obscureConfirmPassword;
                                });
                              },
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return "Confirm Password is missing!";
                              }
                              if (value != _passwordController.text) {
                                return "Passwords do not match!";
                              }
                              return null;
                            }),

                        const SizedBox(height: 20),

                        // Terms and Conditions
                        CustomCheckbox(
                          value: _acceptedTerms,
                          onChanged: (value) {
                            setState(() {
                              _acceptedTerms = value;
                            });
                          },
                          label: "I agree to the ",
                          termsText: "Terms & Conditions",
                        ),
                        const SizedBox(height: 30),

                        // Create Account Button
                        AuthGradientButton(
                          buttonText: "Create Account",
                          onPressed: _onCreateAccountPressed,
                        ),
                        const SizedBox(height: 20),

                        // Sign in link
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Already have an account? ",
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 14,
                              ),
                            ),
                            GestureDetector(
                              onTap: _navigateToLogin,
                              child: const Text(
                                "Sign in",
                                style: TextStyle(
                                  color: Colors.blue,
                                  fontSize: 14,
                                  decoration: TextDecoration.underline,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
