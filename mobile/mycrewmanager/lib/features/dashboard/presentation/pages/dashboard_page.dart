import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/login_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/settings_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/messages_screen.dart';
import 'package:mycrewmanager/features/dashboard/widgets/task_widget.dart';
import 'package:mycrewmanager/features/dashboard/widgets/task_carousel_widget.dart';
import 'package:mycrewmanager/features/dashboard/widgets/incomingtask_widget.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/tasks_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/notifications_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/projects_page.dart';
import 'package:mycrewmanager/core/utils/role_formatter.dart';
import 'package:mycrewmanager/core/constants/constants.dart';


class DashboardPage extends StatefulWidget {
  static Route route() =>
      MaterialPageRoute(builder: (context) => const DashboardPage());

  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthLoggedOut) {
          // Navigate to login page and clear all previous routes
          Navigator.of(context).pushAndRemoveUntil(
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
                )
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
          userRole = RoleFormatter.formatRole(state.user.role);
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
                      CircleAvatar(
                        radius: 28,
                        backgroundImage: state is AuthSuccess && state.user.profilePicture != null
                            ? NetworkImage(
                                '${Constants.baseUrl.replaceAll('/api/', '')}${state.user.profilePicture!}',
                              )
                            : const AssetImage(
                                'lib/core/assets/images/app_logo.png',
                              ) as ImageProvider,
                        onBackgroundImageError: (exception, stackTrace) {
                          // Fallback to default image on error
                        },
                      ),
                      const SizedBox(height: 10),
                      // Name
                      Text(
                        '$userName!',
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
                if (RoleFormatter.getRoleForComparison(state is AuthSuccess ? state.user.role : null) != 'developer')
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
                              // Dispatch logout event to AuthBloc
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

