import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/tasks_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/messages_screen.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/notifications_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/settings_page.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/login_page.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/project_overview_page.dart';
import 'package:mycrewmanager/features/project/presentation/pages/create_project_simple_page.dart';
import 'package:mycrewmanager/features/dashboard/widgets/filter_widget.dart';
import 'package:mycrewmanager/features/dashboard/widgets/modifyproject_widget.dart';
import 'package:mycrewmanager/features/project/presentation/bloc/project_bloc.dart';
import 'package:mycrewmanager/features/project/domain/entities/project.dart';
import 'package:mycrewmanager/core/utils/show_snackbar.dart';
import 'package:mycrewmanager/features/project/presentation/pages/edit_project_page.dart';
import 'package:mycrewmanager/core/utils/role_formatter.dart';
import 'package:mycrewmanager/features/dashboard/widgets/skeleton_loader.dart';

class ProjectsPage extends StatefulWidget {
  const ProjectsPage({super.key});

  static Route<Object?> route() => MaterialPageRoute(builder: (_) => const ProjectsPage());

  @override
  State<ProjectsPage> createState() => _ProjectsPageState();
}

class _ProjectsPageState extends State<ProjectsPage> {
  @override
  void initState() {
    super.initState();
    // Load projects when the page initializes
    context.read<ProjectBloc>().add(ProjectGetProjects());
  }

  void _showDeleteConfirmation(BuildContext context, Project project) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Delete Project'),
          content: Text('Are you sure you want to delete "${project.title}"? This action cannot be undone.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                context.read<ProjectBloc>().add(ProjectDeleteProject(id: project.id));
              },
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );
  }

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
      backgroundColor: const Color(0xFFF8F6FF), // Light purple background
      drawer: _buildAppDrawer(context),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF8F6FF), Color(0xFFFFFFFF)],
            stops: [0.0, 0.3],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Top bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                child: Row(
                  children: [
                    Builder(
                      builder: (context) => IconButton(
                        icon: const Icon(Icons.menu, size: 28, color: Color(0xFF181929)),
                        onPressed: () => Scaffold.of(context).openDrawer(),
                      ),
                    ),
                    const Spacer(),
                  ],
                ),
              ),
              // Header Section
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Projects",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 28,
                        color: Color(0xFF181929),
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      "Manage and track your projects",
                      style: TextStyle(
                        fontSize: 16,
                        color: Color(0xFF7B7F9E),
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Search bar and filter button
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: const Color(0xFF6C63FF).withOpacity(0.2),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF6C63FF).withOpacity(0.1),
                                  blurRadius: 15,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: TextField(
                              decoration: const InputDecoration(
                                prefixIcon: Icon(
                                  Icons.search_rounded,
                                  color: Color(0xFF6C63FF),
                                  size: 22,
                                ),
                                hintText: "Search projects...",
                                hintStyle: TextStyle(
                                  color: Color(0xFF7B7F9E),
                                  fontSize: 16,
                                  fontWeight: FontWeight.w400,
                                ),
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 18,
                                ),
                              ),
                              style: const TextStyle(
                                fontSize: 16,
                                color: Color(0xFF181929),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: const Color(0xFF6C63FF).withOpacity(0.2),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF6C63FF).withOpacity(0.1),
                                blurRadius: 15,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: IconButton(
                            icon: const Icon(
                              Icons.tune_rounded,
                              color: Color(0xFF6C63FF),
                              size: 22,
                            ),
                            onPressed: () async {
                              final result = await showModalBottomSheet<Map<String, String>>(
                                context: context,
                                isScrollControlled: true,
                                shape: const RoundedRectangleBorder(
                                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                                ),
                                builder: (_) => FilterBottomSheet(),
                              );

                              if (result != null) {
                                print("Selected filters: $result");
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Project list
              Expanded(
                child: BlocConsumer<ProjectBloc, ProjectState>(
                  listener: (context, state) {
                    if (state is ProjectFailure) {
                      showSnackBar(context, state.message, Colors.red);
                    } else if (state is ProjectCreated) {
                      showSnackBar(context, "Project created successfully!", Colors.green);
                      // Refresh the project list
                      context.read<ProjectBloc>().add(ProjectGetProjects());
                    } else if (state is ProjectUpdated) {
                      showSnackBar(context, "Project updated successfully!", Colors.green);
                      context.read<ProjectBloc>().add(ProjectGetProjects()); // Refresh
                    } else if (state is ProjectDeleted) {
                      showSnackBar(context, "Project deleted successfully!", Colors.green);
                      context.read<ProjectBloc>().add(ProjectGetProjects()); // Refresh
                    }
                  },
                  builder: (context, state) {
                    if (state is ProjectLoading) {
                      return ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                        itemCount: 3,
                        separatorBuilder: (_, __) => const SizedBox(height: 24),
                        itemBuilder: (_, __) => const ProjectCardSkeleton(),
                      );
                    } else if (state is ProjectSuccess) {
                      final projects = state.projects;
                      if (projects.isEmpty) {
                        return const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.folder_open,
                                size: 64,
                                color: Color(0xFF7B7F9E),
                              ),
                              SizedBox(height: 16),
                              Text(
                                'No projects yet',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF181929),
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Create your first project to get started',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Color(0xFF7B7F9E),
                                ),
                              ),
                            ],
                          ),
                        );
                      }
                      return ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                        itemCount: projects.length,
                        separatorBuilder: (context, index) => const SizedBox(height: 24),
                        itemBuilder: (context, index) {
                          final project = projects[index];
                          return _ProjectCard(
                            project: project,
                            onMore: () {
                              showModalBottomSheet(
                                context: context,
                                shape: const RoundedRectangleBorder(
                                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                                ),
                                builder: (_) => ModifyProjectBottomSheet(
                                  onEdit: () {
                                    Navigator.pop(context);
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => EditProjectPage(project: project),
                                      ),
                                    );
                                  },
                                  onDelete: () {
                                    Navigator.pop(context);
                                    _showDeleteConfirmation(context, project);
                                  },
                                ),
                              );
                            },
                            onTap: () {
                              Navigator.of(context).push(ProjectOverviewPage.route(project));
                            },
                          );
                        },
                      );
                    } else if (state is ProjectFailure) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.error_outline, size: 64, color: Colors.red),
                            const SizedBox(height: 16),
                            Text(
                              'Failed to load projects',
                              style: Theme.of(context).textTheme.headlineSmall,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              state.message,
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: Colors.grey),
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: () {
                                context.read<ProjectBloc>().add(ProjectGetProjects());
                              },
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      );
                    }
                    return const Center(child: CircularProgressIndicator());
                  },
                ),
              ),
              // Add project button (hidden for developers)
              BlocBuilder<AuthBloc, AuthState>(
                builder: (context, authState) {
                  // Check if user has developer role (case-insensitive)
                  bool isDeveloper = false;
                  if (authState is AuthSuccess) {
                    isDeveloper = authState.user.role?.toLowerCase() == 'developer';
                  }
                  
                  // Hide FAB for developers
                  if (isDeveloper) {
                    return const SizedBox.shrink();
                  }
                  
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 24, right: 16),
                    child: Align(
                      alignment: Alignment.bottomRight,
                      child: FloatingActionButton(
                        backgroundColor: const Color(0xFF6C63FF),
                        child: const Icon(Icons.add, color: Colors.white, size: 28),
                        onPressed: () {
                          Navigator.push(context, CreateProjectSimplePage.route());
                        },
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  final Project project;
  final VoidCallback? onMore;
  final VoidCallback? onTap;

  const _ProjectCard({
    required this.project,
    this.onMore,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF6C63FF).withOpacity(0.08),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: const Color(0xFF6C63FF).withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: const Color(0xFF6C63FF).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.folder,
                        color: Color(0xFF6C63FF),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            project.title,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 18,
                              color: Color(0xFF181929),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              project.summary,
                              style: const TextStyle(
                                fontSize: 14,
                                color: Color(0xFF7B7F9E),
                                height: 1.4,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    BlocBuilder<AuthBloc, AuthState>(
                      builder: (context, authState) {
                        bool isDeveloper = false;
                        if (authState is AuthSuccess) {
                          isDeveloper = RoleFormatter.getRoleForComparison(authState.user.role) == 'developer';
                        }

                        if (isDeveloper) {
                          return const SizedBox.shrink();
                        }

                        return IconButton(
                          icon: const Icon(Icons.more_horiz, color: Color(0xFF7B7F9E)),
                          onPressed: onMore,
                        );
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Spacer(),
                    const Icon(
                      Icons.arrow_forward_ios,
                      color: Color(0xFF7B7F9E),
                      size: 16,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
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
    },
  );
}