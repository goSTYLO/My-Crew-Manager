import 'package:flutter/material.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/login_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/settings_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/messages_screen.dart';
import 'package:mycrewmanager/features/dashboard/widgets/task_widget.dart';

class DashboardPage extends StatefulWidget {
  static route() =>
      MaterialPageRoute(builder: (context) => const DashboardPage());

  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: _buildAppDrawer(context),
      appBar: AppBar(
        title: const Text('Dashboard'),
        backgroundColor: Colors.white,
        foregroundColor: const Color.fromARGB(255, 0, 0, 0),
        actions: [
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.blue[50]!, Colors.white],
          ),
        ),
        child: SingleChildScrollView(
          child: Column(
            children: [
              SizedBox(
                width: 450, // Set your desired width
                child: TaskWidget(),
              ),
              // Add more widgets below if needed
            ],
          ),
        ),
      ),
    );   
  }

  Drawer _buildAppDrawer(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 28,
                    backgroundImage: AssetImage(
                      'lib/core/assets/images/app_logo.png',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Sophia Rose',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'UX/UI Designer',
                          style: TextStyle(fontSize: 12, color: Colors.black54),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.tune_rounded),
                    onPressed: () {},
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            // Menu Items
            _DrawerItem(
              icon: Icons.home_outlined,
              label: 'Home',
              onTap: () {
                Navigator.pop(context);
                // Already on Home/Dashboard
              },
            ),
            _DrawerItem(
              icon: Icons.person_outline,
              label: 'Profile',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const _PlaceholderPage(title: 'Profile'),
                  ),
                );
              },
            ),
            _DrawerItem(
              icon: Icons.description_outlined,
              label: 'Explore Task',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) =>
                        const _PlaceholderPage(title: 'Explore Task'),
                  ),
                );
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
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) =>
                        const _PlaceholderPage(title: 'Notifications'),
                  ),
                );
              },
            ),
            _DrawerItem(
              icon: Icons.bookmark_border,
              label: 'Bookmarks',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const _PlaceholderPage(title: 'Bookmarks'),
                  ),
                );
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
}

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
      leading: Icon(icon, color: Colors.black54),
      title: Text(label, style: const TextStyle(fontSize: 16)),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      horizontalTitleGap: 8,
    );
  }
}

class _PlaceholderPage extends StatelessWidget {
  final String title;
  const _PlaceholderPage({required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Text(
          '$title Page (Coming Soon)',
          style: const TextStyle(fontSize: 18),
        ),
      ),
    );
  }
}
