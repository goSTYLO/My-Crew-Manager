import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/features/project/domain/entities/project.dart';
import 'package:mycrewmanager/features/project/presentation/bloc/project_bloc.dart';
import 'package:mycrewmanager/init_dependencies.dart';

class BacklogOverviewPage extends StatefulWidget {
  final Project? project;
  const BacklogOverviewPage({super.key, this.project});

  static Route<Object?> route({Project? project}) =>
      MaterialPageRoute(builder: (_) => BacklogOverviewPage(project: project));

  @override
  State<BacklogOverviewPage> createState() => _BacklogOverviewPageState();
}

class _BacklogOverviewPageState extends State<BacklogOverviewPage> {
  late ProjectBloc _projectBloc;

  @override
  void initState() {
    super.initState();
    _projectBloc = serviceLocator<ProjectBloc>();
    
    // Fetch backlog data when page loads
    if (widget.project != null) {
      _projectBloc.add(ProjectGetBacklog(projectId: widget.project!.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    // Use default values if no project is provided
    final projectTitle = widget.project?.title ?? "My Crew Tasker";

    return BlocProvider.value(
      value: _projectBloc,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Column(
            children: [
              // Top bar with back button
              Padding(
                padding: const EdgeInsets.only(left: 8, top: 8),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black87),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
              const Center(
                child: Text(
                  "Backlog Overview",
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 24,
                    color: Color(0xFF181929),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  "Project: $projectTitle",
                  style: const TextStyle(
                    fontSize: 15,
                    color: Colors.black54,
                  ),
                ),
              ),
              const SizedBox(height: 18),
              // Backlog content
              Expanded(
                child: BlocConsumer<ProjectBloc, ProjectState>(
                  listener: (context, state) {
                    if (state is ProjectFailure) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error: ${state.message}')),
                      );
                    }
                  },
                  builder: (context, state) {
                    if (state is ProjectLoading) {
                      return const Center(
                        child: CircularProgressIndicator(),
                      );
                    } else if (state is ProjectBacklogLoaded) {
                      return _buildBacklogContent(state.backlog);
                    } else if (state is ProjectFailure) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.error_outline, size: 64, color: Colors.red),
                            const SizedBox(height: 16),
                            Text(
                              'Failed to load backlog',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              state.message,
                              style: const TextStyle(fontSize: 14, color: Colors.black54),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: () {
                                if (widget.project != null) {
                                  _projectBloc.add(ProjectGetBacklog(projectId: widget.project!.id));
                                }
                              },
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      );
                    } else {
                      return const Center(
                        child: Text(
                          'No backlog data available',
                          style: TextStyle(fontSize: 16, color: Colors.black54),
                        ),
                      );
                    }
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBacklogContent(Map<String, dynamic> backlogData) {
    final epics = backlogData['epics'] as List<dynamic>? ?? [];
    
    if (epics.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox_outlined, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'No backlog items found',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            SizedBox(height: 8),
            Text(
              'This project doesn\'t have any epics yet',
              style: TextStyle(fontSize: 14, color: Colors.black54),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        children: epics.map((epic) => _buildEpicCard(epic)).toList(),
      ),
    );
  }

  Widget _buildEpicCard(Map<String, dynamic> epic) {
    final subEpics = epic['sub_epics'] as List<dynamic>? ?? [];
    final isComplete = epic['is_complete'] as bool? ?? false;
    final ai = epic['ai'] as bool? ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Epic header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.purple.withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.purple,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'EPIC',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                if (ai) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.purple.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.auto_awesome, size: 12, color: Colors.purple),
                        SizedBox(width: 2),
                        Text(
                          'AI',
                          style: TextStyle(
                            color: Colors.purple,
                            fontWeight: FontWeight.w600,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    epic['title'] ?? 'Untitled Epic',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                      color: Colors.black,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isComplete ? Colors.green.withOpacity(0.15) : Colors.blue.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isComplete ? 'COMPLETE' : 'IN PROGRESS',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: isComplete ? Colors.green : Colors.blue,
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Epic description
          if (epic['description'] != null && epic['description'].toString().isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                epic['description'],
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.black54,
                ),
              ),
            ),
          // Sub-epics
          if (subEpics.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
              child: Column(
                children: subEpics.map((subEpic) => _buildSubEpicCard(subEpic)).toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSubEpicCard(Map<String, dynamic> subEpic) {
    final userStories = subEpic['user_stories'] as List<dynamic>? ?? [];
    final isComplete = subEpic['is_complete'] as bool? ?? false;
    final ai = subEpic['ai'] as bool? ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Sub-epic header
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.pink.withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(8),
                topRight: Radius.circular(8),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.pink,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'SUB-EPIC',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                    ),
                  ),
                ),
                if (ai) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    decoration: BoxDecoration(
                      color: Colors.pink.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(3),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.auto_awesome, size: 10, color: Colors.pink),
                        SizedBox(width: 1),
                        Text(
                          'AI',
                          style: TextStyle(
                            color: Colors.pink,
                            fontWeight: FontWeight.w600,
                            fontSize: 8,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    subEpic['title'] ?? 'Untitled Sub-Epic',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: Colors.black,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: isComplete ? Colors.green.withOpacity(0.15) : Colors.blue.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    isComplete ? 'COMPLETE' : 'IN PROGRESS',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: isComplete ? Colors.green : Colors.blue,
                      fontSize: 9,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // User stories
          if (userStories.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: userStories.map((userStory) => _buildUserStoryCard(userStory)).toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildUserStoryCard(Map<String, dynamic> userStory) {
    final tasks = userStory['tasks'] as List<dynamic>? ?? [];
    final isComplete = userStory['is_complete'] as bool? ?? false;
    final ai = userStory['ai'] as bool? ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User story header
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(6),
                topRight: Radius.circular(6),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                  decoration: BoxDecoration(
                    color: Colors.blue,
                    borderRadius: BorderRadius.circular(3),
                  ),
                  child: const Text(
                    'STORY',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 8,
                    ),
                  ),
                ),
                if (ai) ...[
                  const SizedBox(width: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 1),
                    decoration: BoxDecoration(
                      color: Colors.blue.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(2),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.auto_awesome, size: 8, color: Colors.blue),
                        SizedBox(width: 1),
                        Text(
                          'AI',
                          style: TextStyle(
                            color: Colors.blue,
                            fontWeight: FontWeight.w600,
                            fontSize: 7,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    userStory['title'] ?? 'Untitled User Story',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                      color: Colors.black,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                  decoration: BoxDecoration(
                    color: isComplete ? Colors.green.withOpacity(0.15) : Colors.blue.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    isComplete ? 'COMPLETE' : 'IN PROGRESS',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: isComplete ? Colors.green : Colors.blue,
                      fontSize: 8,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Tasks
          if (tasks.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                children: tasks.map((task) => _buildTaskItem(task)).toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTaskItem(Map<String, dynamic> task) {
    final status = task['status'] as String? ?? 'pending';
    final ai = task['ai'] as bool? ?? false;
    final isCompleted = status.toLowerCase() == 'completed';

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          if (ai) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 1),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.2),
                borderRadius: BorderRadius.circular(2),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.auto_awesome, size: 8, color: Colors.green),
                  SizedBox(width: 1),
                  Text(
                    'AI',
                    style: TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.w600,
                      fontSize: 7,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 6),
          ],
          Expanded(
            child: Text(
              task['title'] ?? 'Untitled Task',
              style: TextStyle(
                fontSize: 11,
                color: isCompleted ? Colors.black54 : Colors.black,
                decoration: isCompleted ? TextDecoration.lineThrough : null,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
            decoration: BoxDecoration(
              color: isCompleted ? Colors.green.withOpacity(0.15) : Colors.blue.withOpacity(0.15),
              borderRadius: BorderRadius.circular(3),
            ),
            child: Text(
              status.toUpperCase(),
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: isCompleted ? Colors.green : Colors.blue,
                fontSize: 8,
              ),
            ),
          ),
        ],
      ),
    );
  }
}