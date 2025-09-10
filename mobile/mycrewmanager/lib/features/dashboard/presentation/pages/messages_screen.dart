import 'package:flutter/material.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/login_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/settings_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/tasks_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/projects_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/notifications_page.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();

  static Route<Object?> route() {
    return MaterialPageRoute(builder: (_) => const MessagesScreen());
  }
}

class _MessagesScreenState extends State<MessagesScreen> {
  final List<Map<String, dynamic>> messages = [
    {
      'name': 'Angelie Crison',
      'avatar': 'https://randomuser.me/api/portraits/women/44.jpg',
      'message': "Thank you very much. I'm glad ...",
      'time': '1 m ago',
      'unread': true,
      'sent': false,
    },
    {
      'name': 'Jakob Saris',
      'avatar': 'https://randomuser.me/api/portraits/men/32.jpg',
      'message': "You : Sure! let me tell you about w...",
      'time': '2 m ago',
      'unread': false,
      'sent': true,
    },
    {
      'name': 'Emery Korsgard',
      'avatar': 'https://randomuser.me/api/portraits/women/68.jpg',
      'message': "Thanks. You are very helpful...",
      'time': '3 m ago',
      'unread': true,
      'sent': false,
    },
    {
      'name': 'Jeremy Zucker',
      'avatar': 'https://randomuser.me/api/portraits/men/65.jpg',
      'message': "You : Sure! let me share about ...",
      'time': '4 m ago',
      'unread': false,
      'sent': true,
    },
    {
      'name': 'Nadia Lauren',
      'avatar': 'https://randomuser.me/api/portraits/women/12.jpg',
      'message': "Is there anything I can help? Just ...",
      'time': '5 m ago',
      'unread': true,
      'sent': false,
    },
    {
      'name': 'Jason Statham',
      'avatar': 'https://randomuser.me/api/portraits/men/1.jpg',
      'message': "You : Sure! let me share about ...",
      'time': '6 m ago',
      'unread': false,
      'sent': true,
    },
    {
      'name': 'Angel Kimberly',
      'avatar': 'https://randomuser.me/api/portraits/women/22.jpg',
      'message': "Okay. I know very well about it ...",
      'time': '7 m ago',
      'unread': true,
      'sent': false,
    },
    {
      'name': 'Jason Momoa',
      'avatar': 'https://randomuser.me/api/portraits/men/11.jpg',
      'message': "You : Sure! let me share about ...",
      'time': '7 m ago',
      'unread': false,
      'sent': true,
    },
  ];

  String search = '';

  Drawer _buildAppDrawer(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            DrawerHeader(
              decoration: const BoxDecoration(
                color: Color(0xFFF7F8FA),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Profile picture
                  const CircleAvatar(
                    radius: 28,
                    backgroundImage: AssetImage(
                      'lib/core/assets/images/app_logo.png',
                    ),
                  ),
                  const SizedBox(height: 10),
                  // Name
                  const Text(
                    'Sophia Rose',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: Colors.black,
                    ),
                  ),
                  // Title
                  const Text(
                    'Project Manager',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.black54,
                    ),
                  ),
                ],
              ),
            ),
            // Menu Items
            _DrawerItem(
              icon: Icons.home_outlined,
              label: 'Home',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, DashboardPage.route());
              },
            ),
            _DrawerItem(
              icon: Icons.folder_open,
              label: 'Projects',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, ProjectsPage.route());
              },
            ),
            _DrawerItem(
              icon: Icons.description_outlined,
              label: 'Tasks',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, TasksPage.route());
              },
            ),
            _DrawerItem(
              icon: Icons.chat_bubble_outline,
              label: 'Messages',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MessagesScreen.route());
              },
            ),
            _DrawerItem(
              icon: Icons.notifications_none,
              label: 'Notifications',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, NotificationsPage.route());
              },
            ),
            _DrawerItem(
              icon: Icons.settings_outlined,
              label: 'Settings',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, SettingsPage.route());
              },
            ),
            _DrawerItem(
              icon: Icons.logout,
              label: 'Logout',
              onTap: () {
                showDialog(
                  context: context,
                  builder: (BuildContext context) {
                    return AlertDialog(
                      title: const Text('Logout'),
                      content: const Text('Are you sure you want to logout?'),
                      actions: [
                        TextButton(
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.black,
                          ),
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Cancel'),
                        ),
                        TextButton(
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.black,
                          ),
                          onPressed: () {
                            Navigator.pop(context); // Close dialog
                            Navigator.pushReplacement(context, LoginPage.route());
                          },
                          child: const Text('Logout'),
                        ),
                      ],
                    );
                  },
                );
              },
            ),
            const Spacer(),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = messages
        .where((msg) =>
            msg['name'].toLowerCase().contains(search.toLowerCase()))
        .toList();

    return Scaffold(
      drawer: _buildAppDrawer(context),
      backgroundColor: const Color(0xFF17603A),
      body: Container(
        color: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 0),
        child: Column(
          children: [
            // Top bar
            Padding(
              padding: const EdgeInsets.only(
                  left: 16, right: 16, top: 24, bottom: 8),
              child: Row(
                children: [
                  Builder(
                    builder: (context) => IconButton(
                      icon: const Icon(Icons.menu),
                      onPressed: () {
                        Scaffold.of(context).openDrawer();
                      },
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.notifications_none_outlined),
                    onPressed: () {},
                  ),
                ],
              ),
            ),
            // Title
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24.0, vertical: 4),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Message',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF181929),
                  ),
                ),
              ),
            ),
            // Search bar and filter
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: InputDecoration(
                        hintText: 'Search Mentors',
                        prefixIcon: const Icon(Icons.search),
                        contentPadding: const EdgeInsets.symmetric(vertical: 0),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFE8ECF4),
                          ),
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF7F7FA),
                        isDense: true,
                      ),
                      onChanged: (val) => setState(() => search = val),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF7F7FA),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE8ECF4)),
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.tune_rounded),
                      onPressed: () {},
                    ),
                  ),
                ],
              ),
            ),
            // Message list
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: filtered.length,
                separatorBuilder: (_, __) => const SizedBox(height: 2),
                itemBuilder: (context, i) {
                  final msg = filtered[i];
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundImage: NetworkImage(msg['avatar']),
                      radius: 24,
                    ),
                    title: Text(
                      msg['name'],
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    subtitle: Text(
                      msg['message'],
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: msg['unread']
                            ? const Color(0xFF181929)
                            : Colors.black54,
                        fontWeight: msg['unread']
                            ? FontWeight.w600
                            : FontWeight.w400,
                      ),
                    ),
                    trailing: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          msg['time'],
                          style: const TextStyle(
                            fontSize: 11,
                            color: Colors.black45,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (msg['unread'])
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            if (msg['sent'])
                              const Icon(
                                Icons.done_all,
                                color: Color(0xFF2563EB),
                                size: 18,
                              ),
                          ],
                        ),
                      ],
                    ),
                    onTap: () {
                      // Implement navigation to chat detail here
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Open chat with ${msg['name']}')),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Drawer item widget
class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: Colors.black87),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
      onTap: onTap,
    );
  }
}

// Placeholder page for navigation
class _PlaceholderPage extends StatelessWidget {
  final String title;
  const _PlaceholderPage({required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
      ),
      body: Center(
        child: Text(
          '$title Page',
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
