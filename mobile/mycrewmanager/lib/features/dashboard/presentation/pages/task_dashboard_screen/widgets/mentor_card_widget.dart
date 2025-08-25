import 'package:flutter/material.dart';

class MentorCardWidget extends StatelessWidget {
  const MentorCardWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Profile image
              ClipRRect(
                borderRadius: BorderRadius.circular(32),
                child: Image.network(
                  'https://randomuser.me/api/portraits/men/32.jpg', // Replace with asset if needed
                  width: 48,
                  height: 48,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(width: 12),
              // Name and role
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'Curious George',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 17,
                        color: Color(0xFF181929),
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'UI UX Design',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF7B7F9E),
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
              // Follow button
              Text(
                '+ Follow',
                style: TextStyle(
                  color: Color(0xFF2563EB),
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              // Task icon and count
              Row(
                children: [
                  Icon(
                    Icons.assignment_outlined,
                    color: Color(0xFF7B7F9E),
                    size: 22,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '40 Task',
                    style: TextStyle(
                      color: Color(0xFF181929),
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 24),
              // Star and rating
              Row(
                children: [
                  Icon(
                    Icons.star,
                    color: Color(0xFFFFB800),
                    size: 22,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '4.7 ',
                    style: TextStyle(
                      color: Color(0xFF181929),
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    '(750 Reviews)',
                    style: TextStyle(
                      color: Color(0xFF7B7F9E),
                      fontSize: 13,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}