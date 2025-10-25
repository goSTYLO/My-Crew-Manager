import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/task_overview_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/projects_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/messages_screen.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/notifications_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/settings_page.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/login_page.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/features/dashboard/widgets/addtask_widget.dart';
import 'package:mycrewmanager/features/project/domain/entities/project.dart';
import 'package:mycrewmanager/features/project/domain/entities/task.dart';
import 'package:mycrewmanager/features/project/domain/usecases/get_project_tasks.dart';
import 'package:mycrewmanager/features/dashboard/widgets/skeleton_loader.dart';
import 'package:mycrewmanager/features/notification/presentation/bloc/notification_bloc.dart';
import 'package:mycrewmanager/features/notification/presentation/bloc/notification_event.dart';
import 'package:mycrewmanager/features/notification/presentation/bloc/notification_state.dart';
import 'package:mycrewmanager/init_dependencies.dart';
import 'package:mycrewmanager/core/utils/role_formatter.dart';
import 'package:mycrewmanager/core/constants/constants.dart';

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
  String searchQuery = '';
  bool isSearching = false;

  final GetProjectTasks _getProjectTasks = serviceLocator<GetProjectTasks>();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this); // Changed from 4 to 3 tabs
    _loadTasks();
    // Load unread count when the page opens
    context.read<NotificationBloc>().add(const LoadUnreadCount());
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
        print('📥 Loaded ${tasksList.length} tasks from API');
        for (var task in tasksList) {
          print('   Task: ${task.title} - Status: ${task.status} - Assignee: ${task.assigneeName}');
        }
        
        // If no tasks are loaded, use mock data for testing
        if (tasksList.isEmpty) {
          // Convert mock data to ProjectTask objects
          final mockProjectTasks = mockTasks.asMap().entries.map((entry) {
            final index = entry.key;
            final mockTask = entry.value;
            // Assign different emails to different tasks for testing
            final assigneeEmails = ['test@example.com', 'user@example.com', 'admin@example.com'];
            final assigneeEmail = assigneeEmails[index % assigneeEmails.length];
            
            return ProjectTask(
              id: mockTask.hashCode, // Use hash as ID for mock data
              title: mockTask['title'] as String,
              status: (mockTask['status'] as String).toLowerCase() == 'to do' ? 'pending' : (mockTask['status'] as String).toLowerCase(),
              userStoryId: 1,
              isAi: false,
              assigneeId: index + 1,
              assigneeName: assigneeEmail,
            );
          }).toList();
          
          setState(() {
            isLoading = false;
            tasks = mockProjectTasks;
          });
        } else {
          setState(() {
            isLoading = false;
            tasks = tasksList;
          });
        }
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
      "status": "Done",
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
      "status": "Done",
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

  List<ProjectTask> getFilteredTasks(String status, String? currentUserEmail, String? currentUserName) {
    List<ProjectTask> filteredTasks = tasks;
    
    // Apply search filter first
    if (searchQuery.isNotEmpty) {
      filteredTasks = tasks.where((task) {
        return task.title.toLowerCase().contains(searchQuery.toLowerCase()) ||
               (task.assigneeName?.toLowerCase().contains(searchQuery.toLowerCase()) ?? false);
      }).toList();
    }
    
    // Then apply status filter
    if (status == "All") return filteredTasks;
    
    // For "To Do" tab, show only pending tasks assigned to the current user
    if (status == "To Do") {
      print('🔍 Filtering To Do tasks for user: $currentUserEmail ($currentUserName)');
      print('📋 Total tasks: ${tasks.length}');
      
      final toDoTasks = filteredTasks.where((t) {
        print('   Task: ${t.title}');
        print('     Status: ${t.status}');
        print('     Assignee: ${t.assigneeName}');
        
        // Check if task is pending
        if (t.status != "pending") {
          print('     ❌ Not pending');
          return false;
        }
        
        // If no current user email, show all pending tasks (fallback)
        if (currentUserEmail == null) {
          print('     ✅ No user email, showing all pending');
          return true;
        }
        
        // Check if task has an assignee
        if (t.assigneeName == null) {
          print('     ❌ No assignee');
          return false;
        }
        
        // Check if the assignee matches the current user
        // The assigneeName might be the user's name or email, so we need to handle both cases
        final assigneeName = t.assigneeName;
        
        // Check multiple matching criteria:
        // 1. Exact email match
        // 2. Exact name match
        // 3. Name contains user's first name (fallback)
        final isAssignedToUser = assigneeName != null && 
            (assigneeName == currentUserEmail || 
             assigneeName == currentUserName ||
             (currentUserName != null && assigneeName.contains(currentUserName.split(' ').first)));
        
        print('     Assignee match: $assigneeName == $currentUserEmail or $currentUserName = $isAssignedToUser');
        
        return isAssignedToUser;
      }).toList();
      
      print('✅ Filtered To Do tasks: ${toDoTasks.length}');
      return toDoTasks;
    }
    
    return filteredTasks.where((t) => t.status.toLowerCase() == status.toLowerCase()).toList();
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
                DrawerHeader(
                  decoration: const BoxDecoration(
                    color: Color(0xFFF7F8FA),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundImage: (state is AuthSuccess && state.user.profilePicture != null)
                            ? NetworkImage('${Constants.baseUrl.replaceAll('/api/', '')}${state.user.profilePicture!}')
                            : const AssetImage(
                                'lib/core/assets/images/app_logo.png',
                              ) as ImageProvider,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        userName,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: Colors.black,
                        ),
                      ),
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

  @override
  Widget build(BuildContext context) {
    final tabLabels = ["All", "To Do", "Done"]; // Removed "In Progress" tab
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
      child: BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        String? currentUserEmail;
        String? currentUserName;
        if (authState is AuthSuccess) {
          currentUserEmail = authState.user.email;
          currentUserName = authState.user.name;
          print('👤 Current user: ${authState.user.name} (${authState.user.email})');
        } else {
          print('❌ No authenticated user found, using test email for demo');
          // Use a test email for demonstration purposes
          currentUserEmail = 'test@example.com';
          currentUserName = 'Test User';
        }
        
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
          if (isSearching)
            Expanded(
              child: Container(
                margin: const EdgeInsets.only(right: 16),
                child: TextField(
                  autofocus: true,
                  decoration: const InputDecoration(
                    hintText: 'Search tasks...',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 8),
                  ),
                  onChanged: (value) {
                    setState(() {
                      searchQuery = value;
                    });
                  },
                ),
              ),
            )
          else
            BlocBuilder<NotificationBloc, NotificationState>(
            builder: (context, state) {
              int unreadCount = 0;
              if (state is UnreadCountLoaded) {
                unreadCount = state.unreadCount;
              }
              
              return Stack(
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined, color: Colors.black87),
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
          IconButton(
              icon: const Icon(Icons.search, color: Colors.black87),
              onPressed: () {
                setState(() {
                  isSearching = true;
                });
              },
            ),
          if (isSearching)
            IconButton(
              icon: const Icon(Icons.close, color: Colors.black87),
              onPressed: () {
                setState(() {
                  isSearching = false;
                  searchQuery = '';
                });
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
            ? ListView.separated(
                padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
                itemCount: 5,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, __) => const TaskListSkeleton(),
              )
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
                      final filtered = getFilteredTasks(tab, currentUserEmail, currentUserName);
                      return filtered.isEmpty
                          ? RefreshIndicator(
                              onRefresh: _loadTasks,
                              child: const Center(
                                child: Text(
                                  'No tasks found',
                                  style: TextStyle(color: Colors.grey),
                                ),
                              ),
                            )
                          : RefreshIndicator(
                              onRefresh: _loadTasks,
                              child: ListView.builder(
                                padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
                                itemCount: filtered.length,
                                itemBuilder: (context, i) {
                                  final t = filtered[i];
                                  final assigneeLabel = t.assigneeName ?? 'Unassigned';
                                  return _TaskCard(
                                    title: t.title,
                                    subtitle: assigneeLabel,
                                    status: t.status,
                                    icon: Icons.task_alt,
                                    iconColor: t.status.toLowerCase() == 'done' ? Colors.green : Colors.blue,
                                    members: [],
                                    progress: t.status.toLowerCase() == 'done' ? 1.0 : 0.0,
                                    onTap: () async {
                                      await Navigator.of(context).push(TaskOverviewPage.route(t));
                                      // Refresh tasks list when returning from task overview
                                      if (mounted) {
                                        _loadTasks();
                                      }
                                    },
                                  );
                                },
                              ),
                            );
                    }).toList(),
                  ),
      ),
        floatingActionButton: BlocBuilder<AuthBloc, AuthState>(
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
            
            return FloatingActionButton(
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
                    builder: (_) => TaskBottomSheet(),
                );
              },
            );
          },
        ),
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
    switch (status.toLowerCase()) {
      case "done":
        return Colors.green;
      case "in progress":
        return Colors.amber;
      case "pending":
      case "to do":
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
                    status.toLowerCase() == "done" ? Colors.green : status.toLowerCase() == "in progress" ? Colors.amber : Colors.black26,
                  ),
                ),
          ],
        ),
      ),
    );
  }
}