import 'package:flutter/material.dart';

class TaskDetailWidget extends StatelessWidget {
  const TaskDetailWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 100,
      color: Colors.grey[300],
      child: Center(
        child: Text(
          'Task Detail Widget Placeholder',
          style: TextStyle(fontSize: 16, color: Colors.black),
        ),
      ),
    );
  }
}