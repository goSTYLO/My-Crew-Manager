import 'package:flutter/material.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/dashboard_page.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  static Route<Object?> route() => MaterialPageRoute(builder: (_) => const NotificationsPage());

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  List<_NotificationItem> notifications = [
    _NotificationItem(
      icon: Icons.assignment_turned_in_rounded,
      iconColor: Colors.blue,
      title: "New Task",
      message: "You've been assigned to the 'AI Model Integration' task in 'Project Phoenix'.",
      time: "1 minute ago",
    ),
    _NotificationItem(
      icon: Icons.access_time_rounded,
      iconColor: Colors.red,
      title: "Upcoming Deadline",
      message: "You've been assigned to the 'AI Model Integration' task in 'Project Phoenix'.",
      time: "1 hour ago",
    ),
    _NotificationItem(
      icon: Icons.chat_rounded,
      iconColor: Colors.green,
      title: "John Doe messaged you",
      message: "You've been assigned to the 'AI Model Integration' task in 'Project Phoenix'.",
      time: "Yesterday",
    ),
    _NotificationItem(
      icon: Icons.folder_rounded,
      iconColor: Colors.purple,
      title: "Project Status Update",
      message: "You've been assigned to the 'AI Model Integration' task in 'Project Phoenix'.",
      time: "12 hours ago",
    ),
    _NotificationItem(
      icon: Icons.check_circle_rounded,
      iconColor: Colors.grey,
      title: "Task Completed",
      message: "You've been assigned to the 'AI Model Integration' task in 'Project Phoenix'.",
      time: "2 days ago",
    ),
    _NotificationItem(
      icon: Icons.warning_rounded,
      iconColor: Colors.yellow,
      title: "Sprint Deadline is approaching!",
      message: "You've been assigned to the 'AI Model Integration' task in 'Project Phoenix'.",
      time: "Yesterday",
    ),
  ];

  void _clearAll() {
    setState(() {
      notifications.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black87),
          onPressed: () {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const DashboardPage()),
              (route) => false,
            );
          },
        ),
        title: const Text(
          "Notifications",
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: notifications.isNotEmpty ? _clearAll : null,
            child: Text(
              "Clear All",
              style: TextStyle(
                color: notifications.isNotEmpty ? Colors.blue : Colors.grey,
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
          ),
        ],
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: notifications.length,
        separatorBuilder: (_, __) => const SizedBox(height: 14),
        itemBuilder: (context, i) {
          final n = notifications[i];
          return Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.07),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: n.iconColor.withOpacity(0.15),
                child: Icon(n.icon, color: n.iconColor, size: 28),
              ),
              title: Text(
                n.title,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  color: Color(0xFF181929),
                ),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    n.message,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF7B7F9E),
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    n.time,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.black38,
                    ),
                  ),
                ],
              ),
              trailing: IconButton(
                icon: const Icon(Icons.more_vert, color: Colors.black38),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('More options tapped')),
                  );
                },
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Tapped: ${n.title}')),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _NotificationItem {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String message;
  final String time;

  _NotificationItem({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.message,
    required this.time,
  });
}