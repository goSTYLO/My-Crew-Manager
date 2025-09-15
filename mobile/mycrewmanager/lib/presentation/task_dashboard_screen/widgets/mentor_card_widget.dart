import 'package:flutter/material.dart';

class MentorCardWidget extends StatelessWidget {
  const MentorCardWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Placeholder widget
    return Container(
      height: 100,
      width: double.infinity,
      color: Colors.grey[300],
      child: Center(
        child: Text(
          'Mentor Card',
          style: TextStyle(fontSize: 18, color: Colors.black54),
        ),
      ),
    );
  }
}