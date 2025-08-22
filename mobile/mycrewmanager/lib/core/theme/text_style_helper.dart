// text_style_helper.dart
import 'package:flutter/material.dart';

class TextStyleHelper {
  static final TextStyleHelper instance = TextStyleHelper._();

  TextStyleHelper._();
  
  final title20SemiBold = TextStyle(fontSize: 20, fontWeight: FontWeight.w600);
  final headline25SemiBold = TextStyle(fontSize: 25, fontWeight: FontWeight.w600);
  final title18ExtraBold = TextStyle(fontSize: 18, fontWeight: FontWeight.w800);
  final title16Regular = TextStyle(fontSize: 16, fontWeight: FontWeight.w400);
  final title16Bold = TextStyle(fontSize: 16, fontWeight: FontWeight.w700);
  final title16Medium = TextStyle(fontSize: 16, fontWeight: FontWeight.w500);
  final body14Medium = TextStyle(fontSize: 14, fontWeight: FontWeight.w500);
  final body14Regular = TextStyle(fontSize: 14, fontWeight: FontWeight.w400);
  final body13Regular = TextStyle(fontSize: 13, fontWeight: FontWeight.w400);
  final headline20SemiBold = TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Colors.black);

  TextStyle get headline24SemiBold => TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: Colors.black,
      );
}