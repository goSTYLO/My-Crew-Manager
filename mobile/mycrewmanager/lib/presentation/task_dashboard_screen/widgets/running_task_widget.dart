import 'package:flutter/material.dart';

class RunningTaskWidget extends StatelessWidget {
  const RunningTaskWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        'Running Task Placeholder',
        style: TextStyle(fontSize: 16, color: Colors.black54),
      ),
    );
  }
}