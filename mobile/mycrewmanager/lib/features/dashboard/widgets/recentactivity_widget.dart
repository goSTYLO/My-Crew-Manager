import 'package:flutter/material.dart';

class RecentActivityWidget extends StatelessWidget {
  const RecentActivityWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Recent Activity",
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 16,
              color: Color(0xFF181929),
            ),
          ),
          const SizedBox(height: 16),
          _ActivityItem(
            avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
            user: "John",
            task: "Task A",
          ),
          const SizedBox(height: 12),
          _ActivityItem(
            avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
            user: "John",
            task: "Epic 1",
          ),
        ],
      ),
    );
  }
}

class _ActivityItem extends StatelessWidget {
  final String avatarUrl;
  final String user;
  final String task;

  const _ActivityItem({
    required this.avatarUrl,
    required this.user,
    required this.task,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          backgroundImage: NetworkImage(avatarUrl),
          radius: 22,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: RichText(
            text: TextSpan(
              style: const TextStyle(
                color: Color(0xFF181929),
                fontSize: 15,
                fontWeight: FontWeight.w400,
              ),
              children: [
                TextSpan(
                  text: "$user ",
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const TextSpan(text: "has marked "),
                TextSpan(
                  text: "\"$task\"",
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const TextSpan(text: " as Completed."),
              ],
            ),
          ),
        ),
      ],
    );
  }
}