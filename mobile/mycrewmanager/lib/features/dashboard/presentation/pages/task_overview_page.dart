import 'package:flutter/material.dart';
import 'package:mycrewmanager/features/project/domain/entities/task.dart';
import 'package:mycrewmanager/features/project/domain/usecases/update_task_status.dart';
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
  String search = '';
  late ProjectTask currentTask;
  final UpdateTaskStatus _updateTaskStatus = serviceLocator<UpdateTaskStatus>();

  @override
  void initState() {
    super.initState();
    currentTask = widget.task;
  }

  Future<void> _markTaskAsComplete() async {
    final result = await _updateTaskStatus(UpdateTaskStatusParams(
      taskId: currentTask.id,
      status: 'completed',
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Container(
          color: Colors.white,
          child: Column(
            children: [
              // Top bar with back button instead of menu
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black87),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.notifications_none, color: Colors.black54),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Notifications tapped')),
                        );
                      },
                    ),
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
              // Search bar and filter button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.search, color: Colors.black38),
                          hintText: "Search Task",
                          contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 0),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Colors.black12),
                          ),
                          filled: true,
                          fillColor: Colors.white,
                          isDense: true,
                        ),
                        onChanged: (val) => setState(() => search = val),
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
              // Task Card
              Expanded(
                child: SingleChildScrollView(
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
                              // Members and Due date
                              Row(
                                children: [
                                  const Icon(Icons.groups_outlined, size: 18, color: Colors.black54),
                                  const SizedBox(width: 6),
                                  const Text(
                                    "Members",
                                    style: TextStyle(fontSize: 14, color: Colors.black54),
                                  ),
                                  const SizedBox(width: 10),
                                  // Avatars
                                  ...[
                                    'https://randomuser.me/api/portraits/women/22.jpg',
                                    'https://randomuser.me/api/portraits/men/2.jpg'
                                  ].map((url) => Padding(
                                        padding: const EdgeInsets.only(right: 4),
                                        child: CircleAvatar(
                                          radius: 14,
                                          backgroundImage: NetworkImage(url),
                                        ),
                                      )),
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
                                      color: currentTask.status.toLowerCase() == 'completed' 
                                          ? Colors.green.withOpacity(0.15)
                                          : Colors.blue.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      currentTask.status.toUpperCase(),
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600, 
                                        color: currentTask.status.toLowerCase() == 'completed' 
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
                                    "Priority:",
                                    style: TextStyle(fontWeight: FontWeight.w500, color: Colors.black54),
                                  ),
                                  SizedBox(width: 8),
                                  Icon(Icons.priority_high, color: Colors.red, size: 18),
                                  SizedBox(width: 2),
                                  Text(
                                    "Highest Priority",
                                    style: TextStyle(fontWeight: FontWeight.w600, color: Colors.red),
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
                                    "Epic",
                                    style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: const [
                                  Text(
                                    "Resolution:",
                                    style: TextStyle(fontWeight: FontWeight.w500, color: Colors.black54),
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    "Unresolved",
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
                                  if (currentTask.assigneeName != null) ...[
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
                              // Mark as Completed Button (only show for pending tasks)
                              if (currentTask.status.toLowerCase() == 'pending') ...[
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
                              ] else ...[
                                // Show completion status for completed tasks
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: Colors.green.withOpacity(0.3)),
                                  ),
                                  child: const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.check_circle, color: Colors.green, size: 20),
                                      SizedBox(width: 8),
                                      Text(
                                        "Task Completed",
                                        style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 16,
                                          color: Colors.green,
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
  }
}