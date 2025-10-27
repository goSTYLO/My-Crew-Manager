import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/features/project/domain/entities/task.dart';
import 'package:mycrewmanager/features/project/domain/usecases/get_user_assigned_tasks.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:mycrewmanager/init_dependencies.dart';
import 'package:mycrewmanager/features/dashboard/utils/task_cache_manager.dart';
import 'package:mycrewmanager/features/dashboard/widgets/skeleton_loader.dart';

class TaskWidget extends StatefulWidget {
  const TaskWidget({super.key});

  @override
  State<TaskWidget> createState() => _TaskWidgetState();
}

class _TaskWidgetState extends State<TaskWidget> with TickerProviderStateMixin {
  List<ProjectTask> allTasks = [];
  List<ProjectTask> userTasks = [];
  bool isLoading = true;
  bool isFirstLoad = true;
  String? error;
  final GetUserAssignedTasks _getUserAssignedTasks = serviceLocator<GetUserAssignedTasks>();
  Timer? _refreshTimer;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _initializeData();
    _startAutoRefresh();
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void _startAutoRefresh() {
    // Auto-refresh every 30 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (timer) async {
      if (mounted && !isLoading) {
        // Check connectivity before attempting refresh
        final connectivityResult = await Connectivity().checkConnectivity();
        if (connectivityResult != ConnectivityResult.none) {
          _pulseController.repeat(reverse: true);
          _loadTasks();
        }
      }
    });
  }

  Future<void> _initializeData() async {
    // Load cached data first
    final cachedTasks = await TaskCacheManager.loadAllTasks();
    if (cachedTasks.isNotEmpty) {
      setState(() {
        allTasks = cachedTasks;
        userTasks = cachedTasks;
        isLoading = false;
        isFirstLoad = false;
      });
    }
    
    // Then fetch fresh data
    await _loadTasks();
  }

  Future<void> _loadTasks() async {
    // Only show loading if this is the first load and no cached data
    if (isFirstLoad && allTasks.isEmpty) {
      setState(() {
        isLoading = true;
        error = null;
      });
    }

    try {
      // Get tasks assigned to the current user from the database
      final result = await _getUserAssignedTasks(NoParams());

      result.fold(
        (failure) {
          setState(() {
            isLoading = false;
            error = failure.message;
            // Keep existing data if API fails
            if (allTasks.isEmpty) {
              _loadMockTasks();
            }
          });
        },
        (tasksList) {
          setState(() {
            isLoading = false;
            allTasks = tasksList;
            userTasks = tasksList; // These are already filtered for the current user
            isFirstLoad = false;
          });
          // Save to cache
          TaskCacheManager.saveAllTasks(tasksList);
          _pulseController.stop();
        },
      );
    } catch (e) {
      setState(() {
        isLoading = false;
        error = e.toString();
        // Keep existing data if API fails
        if (allTasks.isEmpty) {
          _loadMockTasks();
        }
      });
    }
  }

  void _loadMockTasks() {
    // Mock tasks for demonstration
    allTasks = [
      ProjectTask(
        id: 1,
        title: "Design User Interface",
        status: "pending",
        userStoryId: 1,
        isAi: false,
        assigneeId: 1,
        assigneeName: "test@example.com",
      ),
      ProjectTask(
        id: 2,
        title: "Implement Authentication",
        status: "in_progress",
        userStoryId: 1,
        isAi: false,
        assigneeId: 2,
        assigneeName: "user@example.com",
      ),
      ProjectTask(
        id: 3,
        title: "Setup Database",
        status: "done",
        userStoryId: 1,
        isAi: false,
        assigneeId: 1,
        assigneeName: "test@example.com",
      ),
      ProjectTask(
        id: 4,
        title: "Write Unit Tests",
        status: "pending",
        userStoryId: 1,
        isAi: false,
        assigneeId: 3,
        assigneeName: "admin@example.com",
      ),
    ];
    userTasks = allTasks;
    // Save mock data to cache
    TaskCacheManager.saveAllTasks(allTasks);
  }


  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        String userName = 'User';
        if (state is AuthSuccess) {
          userName = state.user.name;
        }

        // Calculate task statistics
        final runningTasks = userTasks.where((task) => task.status == 'in_progress').length;
        final totalTasks = userTasks.length;
        final completedTasks = userTasks.where((task) => task.status == 'done').length;
        final progressPercentage = totalTasks > 0 ? completedTasks / totalTasks : 0.0;

        return Padding(
          padding: const EdgeInsets.only(top: 24.0, left: 24.0, right: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Hi, $userName!',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF181929),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                isLoading 
                  ? "Loading your tasks..."
                  : totalTasks > 0 
                    ? "You have $totalTasks task${totalTasks == 1 ? '' : 's'} assigned to you!"
                    : "No tasks assigned to you yet.",
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF7B7F9E),
                  fontWeight: FontWeight.w400,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Your Tasks',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF181929),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF181929),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: isLoading
                    ? const TaskStatsSkeleton()
                    : Column(
                        children: [
                          Row(
                            children: [
                              // Left: Running Task count
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Running Task',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    '$runningTasks',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 28,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                              const Spacer(),
                              // Center: Circular progress
                              SizedBox(
                                width: 56,
                                height: 56,
                                child: Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    SizedBox(
                                      width: 56,
                                      height: 56,
                                      child: CircularProgressIndicator(
                                        value: progressPercentage,
                                        strokeWidth: 5,
                                        backgroundColor: const Color(0xFF23243B),
                                        valueColor: const AlwaysStoppedAnimation<Color>(
                                          Color(0xFF6C63FF),
                                        ),
                                      ),
                                    ),
                                    Text(
                                      '${(progressPercentage * 100).round()}%',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 15,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Spacer(),
                              // Right: Total Task
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  const SizedBox(height: 4),
                                  Text(
                                    '$totalTasks',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 20,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  const Text(
                                    'Task',
                                    style: TextStyle(
                                      color: Color(0xFFB3B6C7),
                                      fontSize: 13,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

}