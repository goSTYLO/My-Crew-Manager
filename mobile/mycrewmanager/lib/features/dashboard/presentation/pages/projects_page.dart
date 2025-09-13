import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/tasks_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/messages_screen.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/notifications_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/settings_page.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/login_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/project_overview_page.dart';
import 'package:mycrewmanager/features/project/presentation/pages/project_page.dart';

class ProjectsPage extends StatelessWidget {
  const ProjectsPage({super.key});

  static Route<Object?> route() => MaterialPageRoute(builder: (_) => const ProjectsPage());

  @override
  Widget build(BuildContext context) {
    // Set status bar color to white and icons to dark
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.white, // Remove green, set to white
        statusBarIconBrightness: Brightness.dark, // For Android
        statusBarBrightness: Brightness.light, // For iOS
      ),
    );

    return Scaffold(
      backgroundColor: Colors.white, // Set scaffold background to white
      drawer: _buildAppDrawer(context),
      body: SafeArea(
        child: Container(
          color: Colors.white,
          child: Column(
            children: [
              // Top bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                child: Row(
                  children: [
                    Builder(
                      builder: (context) => IconButton(
                        icon: const Icon(Icons.menu, size: 28, color: Colors.black87),
                        onPressed: () => Scaffold.of(context).openDrawer(),
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.notifications_none, color: Colors.black54),
                      onPressed: () {
                        Navigator.of(context).push(NotificationsPage.route());
                      },
                    ),
                  ],
                ),
              ),
              // Projects title
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    "Projects",
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 24,
                      color: Colors.black,
                    ),
                  ),
                ),
              ),
              // Search bar and filter button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.search, color: Colors.black38),
                          hintText: "Search Projects",
                          contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 0),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Colors.black12),
                          ),
                          filled: true,
                          fillColor: Colors.white,
                          isDense: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.black12),
                        borderRadius: BorderRadius.circular(12),
                        color: Colors.white,
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.tune, color: Colors.black54),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Filter tapped')),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
              // Project list
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: [
                    _ProjectListTile(
                      image: 'assets/images/profile.png',
                      title: 'My Crew Tasker',
                      onMore: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('More options for My Crew Tasker')),
                        );
                      },
                      onTap: () {
                        Navigator.of(context).push(ProjectOverviewPage.route());
                      },
                    ),
                    const Divider(height: 1, thickness: 1, indent: 70, endIndent: 8),
                    _ProjectListTile(
                      image: 'assets/images/profile.png',
                      title: 'My Crew Assigner',
                      onMore: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('More options for My Crew Assigner')),
                        );
                      },
                      onTap: () {
                        Navigator.of(context).push(ProjectOverviewPage.route());
                      },
                    ),
                    const Divider(height: 1, thickness: 1, indent: 70, endIndent: 8),
                  ],
                ),
              ),
              // Add project button
              Padding(
                padding: const EdgeInsets.only(bottom: 24, right: 16),
                child: Align(
                  alignment: Alignment.bottomRight,
                  child: FloatingActionButton(
                    backgroundColor: Colors.blue,
                    child: const Icon(Icons.add, color: Colors.white, size: 32),
                    onPressed: () {
                      Navigator.push(context, ProjectPage.route());
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProjectListTile extends StatelessWidget {
  final String image;
  final String title;
  final VoidCallback? onMore;
  final VoidCallback? onTap;

  const _ProjectListTile({
    required this.image,
    required this.title,
    this.onMore,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        radius: 28,
        backgroundImage: AssetImage(image),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 17,
          color: Colors.black,
        ),
      ),
      trailing: IconButton(
        icon: const Icon(Icons.more_horiz, color: Colors.black87),
        onPressed: onMore,
      ),
      contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
      onTap: onTap,
    );
  }
}

// DrawerItem widget for cleaner code
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

// Drawer implementation (same as dashboard_page)
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