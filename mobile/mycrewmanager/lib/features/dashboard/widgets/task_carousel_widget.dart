import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/features/project/domain/entities/task.dart';
import 'package:mycrewmanager/features/project/domain/usecases/get_user_assigned_tasks.dart';
import 'package:mycrewmanager/core/usecase/usercase.dart';
import 'package:mycrewmanager/init_dependencies.dart';

class TaskCarouselWidget extends StatefulWidget {
  const TaskCarouselWidget({super.key});

  @override
  State<TaskCarouselWidget> createState() => _TaskCarouselWidgetState();
}

class _TaskCarouselWidgetState extends State<TaskCarouselWidget> with TickerProviderStateMixin {
  List<ProjectTask> pendingTasks = [];
  bool isLoading = true;
  String? error;
  final GetUserAssignedTasks _getUserAssignedTasks = serviceLocator<GetUserAssignedTasks>();
  Timer? _refreshTimer;
  DateTime? _lastUpdated;
  late PageController _pageController;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _loadPendingTasks();
    _startAutoRefresh();
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoRefresh() {
    // Auto-refresh every 45 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 45), (timer) {
      if (mounted && !isLoading) {
        _loadPendingTasks();
      }
    });
  }

  Future<void> _loadPendingTasks() async {
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
            // Filter only pending tasks for the carousel and limit to 5
            pendingTasks = tasksList
                .where((task) => task.status == 'pending')
                .take(5)
                .toList();
            _lastUpdated = DateTime.now();
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
    // Mock pending tasks for demonstration (limited to 5)
    pendingTasks = [
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
        title: "Implement Authentication System",
        status: "pending",
        userStoryId: 1,
        isAi: false,
        assigneeId: 2,
        assigneeName: "user@example.com",
      ),
      ProjectTask(
        id: 3,
        title: "Write Unit Tests",
        status: "pending",
        userStoryId: 1,
        isAi: false,
        assigneeId: 3,
        assigneeName: "admin@example.com",
      ),
      ProjectTask(
        id: 4,
        title: "Setup Database Schema",
        status: "pending",
        userStoryId: 1,
        isAi: false,
        assigneeId: 1,
        assigneeName: "test@example.com",
      ),
      ProjectTask(
        id: 5,
        title: "Create API Documentation",
        status: "pending",
        userStoryId: 1,
        isAi: false,
        assigneeId: 2,
        assigneeName: "user@example.com",
      ),
    ].take(5).toList(); // Ensure we only take 5 tasks
    _lastUpdated = DateTime.now();
  }

  void _onTaskTap(ProjectTask task) {
    // Navigate to task details or show task options
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(task.title),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Status: ${task.status}'),
              Text('Assignee: ${task.assigneeName ?? 'Unassigned'}'),
              Text('Story ID: ${task.userStoryId}'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                // Here you could navigate to task details page
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Opening ${task.title}...')),
                );
              },
              child: const Text('View Details'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        // String userName = 'User';
        // if (state is AuthSuccess) {
        //   userName = state.user.name;
        // }

        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
              // Header with title and navigation
              Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Pending Tasks",
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                          color: Color(0xFF181929),
                        ),
                      ),
                      if (pendingTasks.isNotEmpty)
                        Text(
                          '${pendingTasks.length} of 5 shown',
                          style: const TextStyle(
                            fontSize: 10,
                            color: Color(0xFF7B7F9E),
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                    ],
                  ),
                  const Spacer(),
                  if (_lastUpdated != null && !isLoading)
                    Text(
                      'Updated ${_formatLastUpdated(_lastUpdated!)}',
                      style: const TextStyle(
                        fontSize: 10,
                        color: Color(0xFF7B7F9E),
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  const SizedBox(width: 8),
                  if (pendingTasks.isNotEmpty) ...[
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new,
                          size: 18, color: Color(0xFFB3B6C7)),
                      onPressed: _currentIndex > 0
                          ? () {
                              _pageController.previousPage(
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                              );
                            }
                          : null,
                      tooltip: "Previous",
                      splashRadius: 20,
                    ),
                    IconButton(
                      icon: const Icon(Icons.arrow_forward_ios,
                          size: 18, color: Color(0xFFB3B6C7)),
                      onPressed: _currentIndex < pendingTasks.length - 1
                          ? () {
                              _pageController.nextPage(
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                              );
                            }
                          : null,
                      tooltip: "Next",
                      splashRadius: 20,
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 8),

              // Task Carousel
              if (isLoading)
                Container(
                  height: 220, // Increased height to match carousel
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    color: const Color(0xFFF7F8FA),
                  ),
                  child: const Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF6C63FF)),
                    ),
                  ),
                )
              else if (error != null)
                Container(
                  height: 220, // Increased height to match carousel
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    color: const Color(0xFFF7F8FA),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
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
              else if (pendingTasks.isEmpty)
                Container(
                  height: 220, // Increased height to match carousel
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    color: const Color(0xFFF7F8FA),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.check_circle_outline,
                          color: Color(0xFF6C63FF),
                          size: 48,
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'No Pending Tasks!',
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
                SizedBox(
                  height: 220, // Increased height to prevent overflow
                  child: PageView.builder(
                    controller: _pageController,
                    onPageChanged: (index) {
                      setState(() {
                        _currentIndex = index;
                      });
                    },
                    itemCount: pendingTasks.length,
                    itemBuilder: (context, index) {
                      final task = pendingTasks[index];
                      return _buildTaskCard(task);
                    },
                  ),
                ),

              // Page indicators
              if (pendingTasks.length > 1) ...[
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    pendingTasks.length,
                    (index) => Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _currentIndex == index
                            ? const Color(0xFF6C63FF)
                            : const Color(0xFFB3B6C7),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildTaskCard(ProjectTask task) {
    return GestureDetector(
      onTap: () => _onTaskTap(task),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: const Color(0xFFF7F8FA),
          border: Border.all(
            color: const Color(0xFF6C63FF).withOpacity(0.2),
            width: 1,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12), // Reduced padding
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min, // Prevent overflow
            children: [
              // Task icon and status
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6), // Reduced padding
                    decoration: BoxDecoration(
                      color: const Color(0xFF6C63FF).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      Icons.task_alt,
                      color: Color(0xFF6C63FF),
                      size: 16, // Reduced size
                    ),
                  ),
                  const SizedBox(width: 8), // Reduced spacing
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'PENDING',
                          style: TextStyle(
                            fontSize: 9, // Reduced font size
                            fontWeight: FontWeight.w600,
                            color: Colors.orange[700],
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 1), // Reduced spacing
                        Text(
                          'Task #${task.id}',
                          style: const TextStyle(
                            fontSize: 10, // Reduced font size
                            color: Color(0xFF7B7F9E),
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10), // Reduced spacing

              // Task title
              Expanded(
                child: Text(
                  task.title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14, // Reduced font size
                    color: Color(0xFF181929),
                    height: 1.2, // Reduced line height
                  ),
                  maxLines: 3, // Allow more lines for title
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(height: 8), // Reduced spacing

              // Task details - combined into one row to save space
              Row(
                children: [
                  const Icon(
                    Icons.person_outline,
                    color: Color(0xFF7B7F9E),
                    size: 14, // Reduced size
                  ),
                  const SizedBox(width: 4), // Reduced spacing
                  Expanded(
                    child: Text(
                      task.assigneeName ?? 'Unassigned',
                      style: const TextStyle(
                        color: Color(0xFF7B7F9E),
                        fontSize: 10, // Reduced font size
                        fontWeight: FontWeight.w400,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8), // Reduced spacing
                  const Icon(
                    Icons.article_outlined,
                    color: Color(0xFF7B7F9E),
                    size: 14, // Reduced size
                  ),
                  const SizedBox(width: 4), // Reduced spacing
                  Text(
                    '#${task.userStoryId}',
                    style: const TextStyle(
                      color: Color(0xFF7B7F9E),
                      fontSize: 10, // Reduced font size
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8), // Reduced spacing

              // Tap to view hint
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 6), // Reduced padding
                decoration: BoxDecoration(
                  color: const Color(0xFF6C63FF).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Tap to view details',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF6C63FF),
                    fontSize: 10, // Reduced font size
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatLastUpdated(DateTime lastUpdated) {
    final now = DateTime.now();
    final difference = now.difference(lastUpdated);
    
    if (difference.inSeconds < 60) {
      return 'just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }
}
