import 'package:flutter/material.dart';

class TimelineItem extends StatelessWidget {

  final Color color;
  final IconData icon;
  final String title;
  final String week;

  const TimelineItem({super.key, required this.color, required this.icon, required this.title, required this.week});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 12),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(title,
                style:
                    const TextStyle(fontWeight: FontWeight.w500, fontSize: 15)),
          ),
          Text(week, style: const TextStyle(color: Colors.grey, fontSize: 13)),
        ],
      ),
    );
  }
}