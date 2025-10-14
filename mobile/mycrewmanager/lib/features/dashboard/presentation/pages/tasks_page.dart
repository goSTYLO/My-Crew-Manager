import 'package:flutter/material.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/task_overview_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/projects_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/messages_screen.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/notifications_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/settings_page.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/login_page.dart';
import 'package:mycrewmanager/features/dashboard/widgets/addtask_widget.dart';
import 'package:mycrewmanager/features/project/domain/entities/project.dart';
import 'package:mycrewmanager/features/project/domain/entities/task.dart';
import 'package:mycrewmanager/features/project/domain/usecases/get_project_tasks.dart';
import 'package:mycrewmanager/init_dependencies.dart';

class TasksPage extends StatefulWidget {
  final Project? project;
  
  const TasksPage({super.key, this.project});

  @override
  State<TasksPage> createState() => _TasksPageState();

  static Route<Object?> route([Project? project]) => MaterialPageRoute(
    builder: (_) => TasksPage(project: project)
  );
}

class _TasksPageState extends State<TasksPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<ProjectTask> tasks = [];
  bool isLoading = true;
  String? error;

  final GetProjectTasks _getProjectTasks = serviceLocator<GetProjectTasks>();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadTasks();
  }

  Future<void> _loadTasks() async {
    if (widget.project == null) {
      setState(() {
        isLoading = false;
        error = 'No project selected';
      });
      return;
    }

    setState(() {
      isLoading = true;
      error = null;
    });

    final result = await _getProjectTasks(GetProjectTasksParams(
      projectId: widget.project!.id,
    ));

    result.fold(
      (failure) {
        setState(() {
          isLoading = false;
          error = failure.message;
        });
      },
      (tasksList) {
        setState(() {
          isLoading = false;
          tasks = tasksList;
        });
      },
    );
  }

  // Mock data for when no project is selected or as fallback
  final List<Map<String, dynamic>> mockTasks = [
    {
      "title": "API Integration for Project A",
      "subtitle": "Sprint 1 • Backend",
      "status": "To Do",
      "icon": Icons.trending_up,
      "iconColor": Colors.red,
      "members": [
        "https://randomuser.me/api/portraits/men/32.jpg",
        "https://randomuser.me/api/portraits/women/44.jpg",
        "https://randomuser.me/api/portraits/men/65.jpg",
        "https://randomuser.me/api/portraits/women/68.jpg",
      ],
      "progress": 0.0,
    },
    {
      "title": "Code Review for Project A",
      "subtitle": "Sprint 1 • Backend",
      "status": "Completed",
      "icon": Icons.trending_up,
      "iconColor": Colors.red,
      "members": [
        "https://randomuser.me/api/portraits/men/32.jpg",
        "https://randomuser.me/api/portraits/women/44.jpg",
      ],
      "progress": 1.0,
    },
    {
      "title": "UI Design for Project A",
      "subtitle": "Sprint 1 • Design",
      "status": "In Progress",
      "icon": Icons.trending_up,
      "iconColor": Colors.red,
      "members": [
        "https://randomuser.me/api/portraits/men/32.jpg",
        "https://randomuser.me/api/portraits/women/44.jpg",
      ],
      "progress": 0.6,
    },
    {
      "title": "Backend Initialization",
      "subtitle": "Sprint 1 • Backend",
      "status": "Completed",
      "icon": Icons.drag_indicator,
      "iconColor": Colors.amber,
      "members": [
        "https://randomuser.me/api/portraits/men/32.jpg",
        "https://randomuser.me/api/portraits/women/44.jpg",
        "https://randomuser.me/api/portraits/men/65.jpg",
      ],
      "progress": 1.0,
    },
    {
      "title": "Redesign Application Logo",
      "subtitle": "Sprint 2 • Design",
      "status": "To Do",
      "icon": Icons.trending_up,
      "iconColor": Colors.red,
      "members": [
        "https://randomuser.me/api/portraits/men/32.jpg",
      ],
      "progress": 0.0,
    },
  ];


  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<ProjectTask> getFilteredTasks(String status) {
    if (status == "All") return tasks;
    return tasks.where((t) => t.status == status).toList();
  }

  Drawer _buildAppDrawer(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(
                color: Color(0xFFF7F8FA),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const CircleAvatar(
                    radius: 28,
                    backgroundImage: AssetImage(
                      'lib/core/assets/images/app_logo.png',
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Sophia Rose',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: Colors.black,
                    ),
                  ),
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
                //Already on Tasks Page
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
                            Navigator.pop(context); 
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
    final tabLabels = ["All", "To Do", "In Progress", "Completed"];
    return Scaffold(
      drawer: _buildAppDrawer(context),
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: Colors.black87),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: Text(
          widget.project != null ? '${widget.project!.title} Tasks' : 'Tasks',
          style: const TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Colors.black87),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Search tapped')),
              );
            },
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: Colors.black,
              unselectedLabelColor: Colors.black38,
              indicatorColor: const Color(0xFF17603A),
              labelStyle: const TextStyle(fontWeight: FontWeight.w700),
              tabs: tabLabels.map((e) => Tab(text: e)).toList(),
            ),
          ),
        ),
      ),
      body: Container(
        color: const Color(0xFFF7F8FA),
        child: isLoading
            ? const Center(child: CircularProgressIndicator())
            : error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          error!,
                          style: const TextStyle(color: Colors.red),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadTasks,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  )
                : TabBarView(
                    controller: _tabController,
                    children: tabLabels.map((tab) {
                      final filtered = getFilteredTasks(tab);
                      return filtered.isEmpty
                          ? const Center(
                              child: Text(
                                'No tasks found',
                                style: TextStyle(color: Colors.grey),
                              ),
                            )
                          : ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
              itemCount: filtered.length,
              itemBuilder: (context, i) {
                final t = filtered[i];
                return _TaskCard(
                  title: t.title,
                  subtitle: "Task ID: ${t.id}",
                  status: t.status,
                  icon: Icons.task_alt,
                  iconColor: t.status == 'completed' ? Colors.green : Colors.blue,
                  members: [], // No members data in current Task model
                  progress: t.status == 'completed' ? 1.0 : 0.0,
                  onTap: () {
                    Navigator.of(context).push(TaskOverviewPage.route());
                  },
                );
              },
            );
                    }).toList(),
                  ),
      ),
        floatingActionButton: FloatingActionButton(
          backgroundColor: Colors.black,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Icon(Icons.add, color: Colors.white, size: 32),
          onPressed: () {
          showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              builder: (_) => TaskBottomSheet(), // ✅ now recognized
          );
        },
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
      leading: Icon(icon, color: Colors.black87),
      title: Text(
        label,
        style: const TextStyle(
          color: Colors.black87,
          fontWeight: FontWeight.w500,
        ),
      ),
      onTap: onTap,
    );
  }
}

class _TaskCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String status;
  final IconData icon;
  final Color iconColor;
  final List<String> members;
  final double progress;
  final VoidCallback? onTap;

  const _TaskCard({
    required this.title,
    required this.subtitle,
    required this.status,
    required this.icon,
    required this.iconColor,
    required this.members,
    required this.progress,
    this.onTap,
  });

  Color getStatusColor() {
    switch (status) {
      case "Completed":
        return Colors.green;
      case "In Progress":
        return Colors.amber;
      case "To Do":
      default:
        return Colors.black38;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 18),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.black12, width: 1),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 19,
                      color: Color(0xFF181929),
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: getStatusColor().withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(
                      color: getStatusColor(),
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(icon, color: iconColor, size: 22),
                const SizedBox(width: 8),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    color: Color(0xFF181929),
                  ),
                ),
                const Spacer(),
                SizedBox(
                  width: 50,
                  height: 28,
                  child: Stack(
                    children: [
                      for (int i = 0; i < members.length; i++)
                        Positioned(
                          left: i * 18,
                          child: Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.white, width: 2),
                              shape: BoxShape.circle,
                            ),
                            child: ClipOval(
                              child: Image.network(
                                members[i],
                                fit: BoxFit.cover,
                                width: 28,
                                height: 28,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Text(
              "Assigned Members",
              style: TextStyle(
                color: Colors.black54,
                fontSize: 13,
                fontWeight: FontWeight.w400,
              ),
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: const Color(0xFFE8ECF4),
              valueColor: AlwaysStoppedAnimation<Color>(
                status == "Completed" ? Colors.green : status == "In Progress" ? Colors.amber : Colors.black26,
              ),
            ),
          ],
        ),
      ),
    );
  }
}