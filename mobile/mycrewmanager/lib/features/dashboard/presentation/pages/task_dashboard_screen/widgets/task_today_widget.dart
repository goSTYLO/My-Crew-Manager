import 'package:flutter/material.dart';

class TaskTodayWidget extends StatelessWidget {
  const TaskTodayWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            children: [
              const Text(
                'Task Today',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                  color: Color(0xFF181929),
                ),
              ),
              const Spacer(),
              Icon(Icons.more_horiz, color: Color(0xFF181929), size: 24),
            ],
          ),
          const SizedBox(height: 16),
          // Task image
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.network(
              'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
              height: 120,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(height: 16),
          // Title
          const Text(
            'Creating Awesome Mobile Apps',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 17,
              color: Color(0xFF181929),
            ),
          ),
          const SizedBox(height: 4),
          // Subtitle
          const Text(
            'UI/UX Designer',
            style: TextStyle(
              fontSize: 13,
              color: Color(0xFF7B7F9E),
              fontWeight: FontWeight.w400,
            ),
          ),
          const SizedBox(height: 16),
          // Progress row
          Row(
            children: [
              const Text(
                'Progress',
                style: TextStyle(
                  color: Color(0xFF181929),
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(),
              const Text(
                '75%',
                style: TextStyle(
                  color: Color(0xFF2563EB),
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: 0.75,
              minHeight: 6,
              backgroundColor: const Color(0xFFE8ECF4),
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2563EB)),
            ),
          ),
          const SizedBox(height: 16),
          // Bottom row: time left and avatars
          Row(
            children: [
              const Icon(
                Icons.access_time,
                color: Color(0xFF7B7F9E),
                size: 20,
              ),
              const SizedBox(width: 6),
              const Text(
                '1 Hour',
                style: TextStyle(
                  color: Color(0xFF181929),
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(),
              SizedBox(
                width: 82,
                height: 28,
                child: Stack(
                  children: [
                    _buildAvatar('https://randomuser.me/api/portraits/men/32.jpg', 0),
                    _buildAvatar('https://randomuser.me/api/portraits/women/44.jpg', 18),
                    _buildAvatar('https://randomuser.me/api/portraits/men/65.jpg', 36),
                    _buildAvatar('https://randomuser.me/api/portraits/women/68.jpg', 54),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  static Widget _buildAvatar(String url, double left) {
    return Positioned(
      left: left,
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.white, width: 2),
          shape: BoxShape.circle,
        ),
        child: ClipOval(
          child: Image.network(
            url,
            fit: BoxFit.cover,
            width: 28,
            height: 28,
          ),
        ),
      ),
    );
  }
}