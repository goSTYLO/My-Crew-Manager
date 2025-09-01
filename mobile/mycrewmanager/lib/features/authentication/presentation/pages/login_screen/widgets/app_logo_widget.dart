import 'package:flutter/material.dart';
import 'package:sizer/sizer.dart';


class AppLogoWidget extends StatelessWidget {
  const AppLogoWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 45.w,
      height: 45.w,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.transparent, // <-- Make background transparent
      ),
      child: Center(
        child: Image.asset(
          'assets/images/logo.png',
          width: 100.w, // Make logo larger to fill the circle
          height: 100.w,
          fit: BoxFit.contain,
        ),
      ),
    );
  }
}
