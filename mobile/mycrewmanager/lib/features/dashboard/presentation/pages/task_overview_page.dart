import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/features/project/domain/entities/task.dart';
import 'package:mycrewmanager/features/project/domain/usecases/update_task_status.dart';
import 'package:mycrewmanager/features/dashboard/widgets/skeleton_loader.dart';
import 'package:mycrewmanager/init_dependencies.dart';

class TaskOverviewPage extends StatefulWidget {
  final ProjectTask task;
  
  const TaskOverviewPage({super.key, required this.task});

  static Route<Object?> route(ProjectTask task) => MaterialPageRoute(
    builder: (_) => TaskOverviewPage(task: task)
  );

  @override
  State<TaskOverviewPage> createState() => _TaskOverviewPageState();
}

class _TaskOverviewPageState extends State<TaskOverviewPage> {
  late ProjectTask currentTask;
  final UpdateTaskStatus _updateTaskStatus = serviceLocator<UpdateTaskStatus>();
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    currentTask = widget.task;
    _simulateLoading();
  }

  Future<void> _simulateLoading() async {
    // Simulate loading time for skeleton effect
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) {
      setState(() {
        isLoading = false;
      });
    }
  }

  bool _isCurrentUserAssignee(String? currentUserEmail, String? currentUserName, String? currentUserId) {
    
    if (currentTask.assigneeId == null && currentTask.assigneeName == null) {
      return false; // No assignee, so no one can mark it complete
    }
    
    if (currentUserId == null && currentUserEmail == null && currentUserName == null) {
      return false; // No current user info
    }
    
    // Primary check: Compare user ID with assignee ID
    if (currentUserId != null && currentTask.assigneeId != null) {
      final idMatch = currentUserId == currentTask.assigneeId.toString();
      if (idMatch) {
        return true;
      }
    }
    
    // Fallback checks: Compare names/emails
    final assigneeName = currentTask.assigneeName;
    if (assigneeName != null) {
      final emailMatch = assigneeName == currentUserEmail;
      final nameMatch = assigneeName == currentUserName;
      final firstNameMatch = currentUserName != null && assigneeName.contains(currentUserName.split(' ').first);
      
      
      final isMatch = emailMatch || nameMatch || firstNameMatch;
      return isMatch;
    }
    
    return false;
  }

  Future<void> _markTaskAsComplete() async {
    // Show dialog to get commit title
    final commitTitle = await _showCommitTitleDialog();
    if (commitTitle == null) return; // User cancelled

    final result = await _updateTaskStatus(UpdateTaskStatusParams(
      taskId: currentTask.id,
      status: 'done',
      commitTitle: commitTitle,
    ));

    result.fold(
      (failure) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update task: ${failure.message}')),
        );
      },
      (updatedTask) {
        setState(() {
          currentTask = updatedTask;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Task marked as complete!')),
        );
      },
    );
  }

  Future<String?> _showCommitTitleDialog() async {
    final TextEditingController commitController = TextEditingController();
    commitController.text = 'Task completed: ${currentTask.title}';

    return showDialog<String>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Mark Task as Complete'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Please provide a commit title for this task completion:'),
              const SizedBox(height: 16),
              TextField(
                controller: commitController,
                decoration: const InputDecoration(
                  labelText: 'Commit Title',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final title = commitController.text.trim();
                if (title.isNotEmpty) {
                  Navigator.of(context).pop(title);
                }
              },
              child: const Text('Complete Task'),
            ),
          ],
        );
      },
    );
  }


  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        String? currentUserEmail;
        String? currentUserName;
        String? currentUserId;
        if (authState is AuthSuccess) {
          currentUserEmail = authState.user.email;
          currentUserName = authState.user.name;
          currentUserId = authState.user.id;
        }
        
        final isAssignee = _isCurrentUserAssignee(currentUserEmail, currentUserName, currentUserId);
        
        return Scaffold(
          backgroundColor: Colors.white,
          body: SafeArea(
        child: Container(
          color: Colors.white,
          child: Column(
            children: [
              // Top bar with back button instead of menu
              Padding(
                padding: const EdgeInsets.only(left: 8, right: 20, top: 18, bottom: 18),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black87),
                      onPressed: () => Navigator.pop(context),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                    const Spacer(),
                  ],
                ),
              ),
              // Title
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    "Task Overview",
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 22,
                      color: Colors.black,
                    ),
                  ),
                ),
              ),
              // Task Card
              Expanded(
                child: isLoading 
                    ? const TaskOverviewSkeleton()
                    : SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 0),
                        child: Column(
                    children: [
                      Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.04),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(18.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Task image
                              ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.network(
                                  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
                                  height: 140,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                ),
                              ),
                              const SizedBox(height: 18),
                              // Task title
                              Text(
                                currentTask.title,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 20,
                                  color: Colors.black,
                                ),
                              ),
                              const SizedBox(height: 8),
                              // Task description
                              Text(
                                "This task is part of the project backlog and needs to be completed according to the project requirements.",
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: Colors.black54,
                                ),
                              ),
                              const SizedBox(height: 18),
                              // Due date only
                              Row(
                                children: [
                                  const Spacer(),
                                  const Icon(Icons.calendar_today_outlined, size: 18, color: Colors.black54),
                                  const SizedBox(width: 4),
                                  const Text(
                                    "Due 09/28/24",
                                    style: TextStyle(fontSize: 14, color: Colors.black54),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 18),
                              // Details
                              const Text(
                                "Details",
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 16,
                                  color: Colors.black,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  const Text(
                                    "Status:",
                                    style: TextStyle(fontWeight: FontWeight.w500, color: Colors.black54),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: currentTask.status.toLowerCase() == 'done' 
                                          ? Colors.green.withOpacity(0.15)
                                          : Colors.blue.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      currentTask.status.toUpperCase(),
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600, 
                                        color: currentTask.status.toLowerCase() == 'done' 
                                            ? Colors.green 
                                            : Colors.blue,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: const [
                                  Text(
                                    "Type:",
                                    style: TextStyle(fontWeight: FontWeight.w500, color: Colors.black54),
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    "Task",
                                    style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  const Text(
                                    "Assignee:",
                                    style: TextStyle(fontWeight: FontWeight.w500, color: Colors.black54),
                                  ),
                                  const SizedBox(width: 8),
                                  if (currentTask.assigneeName != null && currentTask.assigneeName!.isNotEmpty) ...[
                                    CircleAvatar(
                                      radius: 16,
                                      backgroundColor: Colors.blue.withOpacity(0.1),
                                      child: Text(
                                        currentTask.assigneeName!.substring(0, 1).toUpperCase(),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          color: Colors.blue,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      currentTask.assigneeName!,
                                      style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.black),
                                    ),
                                  ] else ...[
                                    const Text(
                                      "Unassigned",
                                      style: TextStyle(fontWeight: FontWeight.w600, color: Colors.grey),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 24),
                              // Mark as Completed Button (only show for pending tasks assigned to current user)
                              if (currentTask.status.toLowerCase() == 'pending' && isAssignee) ...[
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.green,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(vertical: 16),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                    ),
                                    onPressed: _markTaskAsComplete,
                                    child: const Text(
                                      "Mark as Complete",
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ),
                                ),
                              ] else if (currentTask.status.toLowerCase() == 'done') ...[
                                // Show completion status for completed tasks
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: Colors.green.withOpacity(0.3)),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.check_circle, color: Colors.green, size: 20),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          "Task Completed",
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 16,
                                            color: Colors.green,
                                          ),
                                          textAlign: TextAlign.center,
                                          overflow: TextOverflow.visible,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ] else if (!isAssignee) ...[
                                // Show message for non-assignees viewing pending tasks
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: Colors.grey.withOpacity(0.3)),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.person_outline, color: Colors.grey, size: 20),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          "Only the assignee can mark this task as complete",
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 16,
                                            color: Colors.grey,
                                          ),
                                          textAlign: TextAlign.center,
                                          overflow: TextOverflow.visible,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
        );
      },
    );
  }
}