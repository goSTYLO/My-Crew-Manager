import 'package:flutter/material.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/signup_page.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/login_page.dart';

class SignupRoleSelectionPage extends StatefulWidget {
  static Route route() =>
      MaterialPageRoute(builder: (context) => const SignupRoleSelectionPage());

  const SignupRoleSelectionPage({super.key});

  @override
  State<SignupRoleSelectionPage> createState() => _SignupRoleSelectionPageState();
}

class _SignupRoleSelectionPageState extends State<SignupRoleSelectionPage> {
  String? selectedRole;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pushReplacement(context, LoginPage.route()),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Main Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24.0),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Title
                    const Text(
                      'Choose Your Role',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF181929),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Select your role to continue with signup',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF7B7F9E),
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Role Selection Cards
                    _buildRoleCard(
                      icon: Icons.code,
                      title: 'Developer',
                      description: 'For those who build and create.',
                      role: 'developer',
                    ),
                    const SizedBox(height: 16),
                    _buildRoleCard(
                      icon: Icons.assignment,
                      title: 'Project Manager',
                      description: 'For those who plan and organize.',
                      role: 'project_manager',
                    ),
                    const SizedBox(height: 32),

                    // Continue Button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: selectedRole != null ? _onContinue : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: selectedRole != null 
                              ? const Color(0xFF6C63FF) 
                              : Colors.grey[300],
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'Continue',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard({
    required IconData icon,
    required String title,
    required String description,
    required String role,
  }) {
    final isSelected = selectedRole == role;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          selectedRole = role;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF6C63FF).withOpacity(0.1) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF6C63FF) : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            // Icon
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: isSelected 
                    ? const Color(0xFF6C63FF) 
                    : const Color(0xFF6C63FF).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: isSelected ? Colors.white : const Color(0xFF6C63FF),
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            
            // Text Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? const Color(0xFF6C63FF) : const Color(0xFF181929),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 14,
                      color: isSelected ? const Color(0xFF6C63FF) : const Color(0xFF7B7F9E),
                    ),
                  ),
                ],
              ),
            ),
            
            // Selection Indicator
            if (isSelected)
              Container(
                width: 24,
                height: 24,
                decoration: const BoxDecoration(
                  color: Color(0xFF6C63FF),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check,
                  color: Colors.white,
                  size: 16,
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _onContinue() {
    if (selectedRole != null) {
      // Navigate to signup page with the selected role
      Navigator.pushReplacement(
        context,
        SignUpPage.route(selectedRole: selectedRole!),
      );
    }
  }
}
