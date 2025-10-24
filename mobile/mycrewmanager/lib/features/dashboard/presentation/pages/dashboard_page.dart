import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/login_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/settings_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/messages_screen.dart';
import 'package:mycrewmanager/features/dashboard/widgets/task_widget.dart';
import 'package:mycrewmanager/features/dashboard/widgets/task_carousel_widget.dart';
import 'package:mycrewmanager/features/dashboard/widgets/incomingtask_widget.dart';
import 'package:mycrewmanager/features/dashboard/widgets/recentactivity_widget.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/tasks_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/notifications_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/projects_page.dart';
import 'package:mycrewmanager/features/notification/presentation/bloc/notification_bloc.dart';
import 'package:mycrewmanager/features/notification/presentation/bloc/notification_event.dart';
import 'package:mycrewmanager/features/notification/presentation/bloc/notification_state.dart';


class DashboardPage extends StatefulWidget {
  static Route route() =>
      MaterialPageRoute(builder: (context) => const DashboardPage());

  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  @override
  void initState() {
    super.initState();
    // Load unread count when the page opens
    context.read<NotificationBloc>().add(const LoadUnreadCount());
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthLoggedOut) {
          Navigator.pushAndRemoveUntil(
            context,
            LoginPage.route(),
            (route) => false,
          );
        }
      },
      child: Scaffold(
        drawer: _buildAppDrawer(context),
        appBar: AppBar(
          title: const Text('Dashboard'),
          backgroundColor: Colors.white,
          foregroundColor: const Color.fromARGB(255, 0, 0, 0),
          actions: [
            BlocBuilder<NotificationBloc, NotificationState>(
              builder: (context, state) {
                int unreadCount = 0;
                if (state is UnreadCountLoaded) {
                  unreadCount = state.unreadCount;
                }
                
                return Stack(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.notifications_outlined),
                      onPressed: () {
                        Navigator.push(context, NotificationsPage.route());
                      },
                    ),
                    if (unreadCount > 0)
                      Positioned(
                        right: 8,
                        top: 8,
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 16,
                            minHeight: 16,
                          ),
                          child: Text(
                            unreadCount > 99 ? '99+' : unreadCount.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
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
                // --- Add TaskCarouselWidget below TaskWidget ---
                SizedBox(
                  width: 450,
                  child: TaskCarouselWidget(),
                ),
                SizedBox(
                  width: 450,
                  child: IncomingTaskWidget(
                    onViewAll: () {
                      // Implement your "View All" logic here
                    },
                  ),
                ),
                SizedBox(
                  width: 450,
                  child: RecentActivityWidget(),
                ),
                // Add more widgets below if needed
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAppDrawer(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        String userName = 'User';
        String userRole = 'User';
        
        if (state is AuthSuccess) {
          userName = state.user.name;
          userRole = state.user.role ?? 'User';
        }

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
                      Text(
                        userName,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: Colors.black,
                        ),
                      ),
                      // Title/Role
                      Text(
                        userRole,
                        style: const TextStyle(
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
                    // Already on Home/Dashboard
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
                // Hide Tasks menu item for developers
                if (userRole.toLowerCase() != 'developer')
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
                              context.read<AuthBloc>().add(AuthLogout());
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
      },
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

