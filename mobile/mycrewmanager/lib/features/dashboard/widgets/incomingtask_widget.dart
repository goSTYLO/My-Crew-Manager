import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/features/project/domain/entities/task.dart';
import 'package:mycrewmanager/features/project/domain/usecases/get_user_assigned_tasks.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/tasks_page.dart';
import 'package:mycrewmanager/init_dependencies.dart';

class IncomingTaskWidget extends StatefulWidget {
  final VoidCallback? onViewAll;

  const IncomingTaskWidget({super.key, this.onViewAll});

  @override
  State<IncomingTaskWidget> createState() => _IncomingTaskWidgetState();
}

class _IncomingTaskWidgetState extends State<IncomingTaskWidget> {
  List<ProjectTask> upcomingTasks = [];
  bool isLoading = true;
  String? error;
  final GetUserAssignedTasks _getUserAssignedTasks = serviceLocator<GetUserAssignedTasks>();
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _loadUpcomingTasks();
    _startAutoRefresh();
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  void _startAutoRefresh() {
    // Auto-refresh every 60 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 60), (timer) {
      if (mounted && !isLoading) {
        _loadUpcomingTasks();
      }
    });
  }

  Future<void> _loadUpcomingTasks() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      // Get tasks assigned to the current user from the database
      final result = await _getUserAssignedTasks(NoParams());

      result.fold(
        (failure) {
          setState(() {
            isLoading = false;
            error = failure.message;
            // Use mock data as fallback
            _loadMockTasks();
          });
        },
        (tasksList) {
          setState(() {
            isLoading = false;
            // Filter upcoming tasks (pending and in_progress) and limit to 3
            upcomingTasks = tasksList
                .where((task) => task.status == 'pending' || task.status == 'in_progress')
                .take(3)
                .toList();
          });
        },
      );
    } catch (e) {
      setState(() {
        isLoading = false;
        error = e.toString();
        _loadMockTasks();
      });
    }
  }

  void _loadMockTasks() {
    // Mock upcoming tasks for demonstration (limited to 3)
    upcomingTasks = [
      ProjectTask(
        id: 1,
        title: "API Integration for Project A",
        status: "pending",
        userStoryId: 1,
        isAi: false,
        assigneeId: 1,
        assigneeName: "test@example.com",
      ),
      ProjectTask(
        id: 2,
        title: "Code Review for Project X",
        status: "in_progress",
        userStoryId: 1,
        isAi: false,
        assigneeId: 2,
        assigneeName: "user@example.com",
      ),
      ProjectTask(
        id: 3,
        title: "Design Mobile UI Design",
        status: "pending",
        userStoryId: 1,
        isAi: false,
        assigneeId: 3,
        assigneeName: "admin@example.com",
      ),
    ].take(3).toList();
  }

  IconData _getTaskIcon(String title) {
    // Determine icon based on task title keywords
    final lowerTitle = title.toLowerCase();
    if (lowerTitle.contains('api') || lowerTitle.contains('integration') || lowerTitle.contains('database')) {
      return Icons.storage;
    } else if (lowerTitle.contains('code') || lowerTitle.contains('review') || lowerTitle.contains('development')) {
      return Icons.code;
    } else if (lowerTitle.contains('design') || lowerTitle.contains('ui') || lowerTitle.contains('ux')) {
      return Icons.design_services;
    } else if (lowerTitle.contains('test') || lowerTitle.contains('testing')) {
      return Icons.bug_report;
    } else if (lowerTitle.contains('deploy') || lowerTitle.contains('deployment')) {
      return Icons.cloud_upload;
    } else {
      return Icons.task_alt;
    }
  }

  String _getDueDateText(ProjectTask task) {
    // Mock due date logic - in a real app, you'd calculate based on actual due dates
    final taskId = task.id;
    switch (taskId % 3) {
      case 0:
        return "Due Tomorrow";
      case 1:
        return "Due Today";
      case 2:
        return "Due in 3 Days";
      default:
        return "Due Soon";
    }
  }

  Color _getDueDateColor(String dueText) {
    if (dueText.contains("Today")) {
      return Colors.red;
    } else if (dueText.contains("Tomorrow")) {
      return Colors.orange;
    } else {
      return Colors.black38;
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        String? userRole;
        if (state is AuthSuccess) {
          userRole = state.user.role;
        }

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
              // Header
              Row(
                children: [
                  const Text(
                    "Upcoming Tasks",
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                      color: Color(0xFF181929),
                    ),
                  ),
                  const Spacer(),
                  // Hide "View All" button for developers
                  if (userRole?.toLowerCase() != 'developer')
                    GestureDetector(
                      onTap: () {
                        Navigator.of(context).push(TasksPage.route());
                      },
                      child: const Text(
                        "View All",
                        style: TextStyle(
                          color: Colors.blue,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),

              // Tasks List
              if (isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(20),
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF6C63FF)),
                    ),
                  ),
                )
              else if (error != null)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        const Icon(
                          Icons.error_outline,
                          color: Colors.red,
                          size: 32,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Error loading tasks',
                          style: const TextStyle(
                            color: Color(0xFF181929),
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          error!,
                          style: const TextStyle(
                            color: Color(0xFF7B7F9E),
                            fontSize: 12,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                )
              else if (upcomingTasks.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        const Icon(
                          Icons.check_circle_outline,
                          color: Color(0xFF6C63FF),
                          size: 48,
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'No Upcoming Tasks!',
                          style: TextStyle(
                            color: Color(0xFF181929),
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'All caught up! 🎉',
                          style: TextStyle(
                            color: Color(0xFF7B7F9E),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ...upcomingTasks.asMap().entries.map((entry) {
                  final index = entry.key;
                  final task = entry.value;
                  final isLast = index == upcomingTasks.length - 1;
                  
                  return Column(
                    children: [
                      _buildTaskRow(task),
                      if (!isLast)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          child: Divider(height: 1, color: Color(0xFFE8ECF4)),
                        ),
                    ],
                  );
                }).toList(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTaskRow(ProjectTask task) {
    final dueText = _getDueDateText(task);
    final dueColor = _getDueDateColor(dueText);
    final taskIcon = _getTaskIcon(task.title);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CircleAvatar(
          backgroundColor: const Color(0xFFF7F8FA),
          radius: 22,
          child: Icon(taskIcon, color: Colors.black54, size: 28),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                task.title,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                  color: Color(0xFF181929),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                dueText,
                style: TextStyle(
                  color: dueColor,
                  fontWeight: FontWeight.w500,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}