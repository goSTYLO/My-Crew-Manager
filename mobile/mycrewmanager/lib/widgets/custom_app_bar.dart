// custom_app_bar.dart
import 'package:flutter/material.dart';

class CustomAppBar extends StatelessWidget {
  final String logoPath;
  final String title;
  final TextStyle titleStyle;
  final double height;
  final Color backgroundColor;

  const CustomAppBar({
    required this.logoPath,
    required this.title,
    required this.titleStyle,
    required this.height,
    required this.backgroundColor,
    Key? key, required Null Function() onLogoPressed, required String actionIconPath, required Null Function() onActionPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      color: backgroundColor,
      child: Row(
        children: [
          Image.asset(logoPath, height: height * 0.8),
          SizedBox(width: 16),
          Text(title, style: titleStyle),
        ],
      ),
    );
  }
}