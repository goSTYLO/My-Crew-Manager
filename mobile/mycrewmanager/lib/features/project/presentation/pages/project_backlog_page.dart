import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mycrewmanager/features/project/domain/entities/project.dart';
import 'package:mycrewmanager/features/project/domain/entities/backlog.dart';
import 'package:mycrewmanager/features/project/domain/entities/epic.dart';
import 'package:mycrewmanager/features/project/domain/entities/sub_epic.dart';
import 'package:mycrewmanager/features/project/domain/entities/user_story.dart';
import 'package:mycrewmanager/features/project/domain/entities/backlog_task.dart';
import 'package:mycrewmanager/features/project/domain/usecases/get_project_backlog.dart';
import 'package:mycrewmanager/init_dependencies.dart';

class ProjectBacklogPage extends StatefulWidget {
  final Project? project;
  
  const ProjectBacklogPage({super.key, this.project});

  static Route<Object?> route([Project? project]) => MaterialPageRoute(
    builder: (_) => ProjectBacklogPage(project: project)
  );

  @override
  State<ProjectBacklogPage> createState() => _ProjectBacklogPageState();
}

class _ProjectBacklogPageState extends State<ProjectBacklogPage> {
  Backlog? backlog;
  bool isLoading = true;
  String? error;

  final GetProjectBacklog _getProjectBacklog = serviceLocator<GetProjectBacklog>();

  @override
  void initState() {
    super.initState();
    _loadBacklog();
  }

  Future<void> _loadBacklog() async {
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

    final result = await _getProjectBacklog(widget.project!.id);

    result.fold(
      (failure) {
        setState(() {
          isLoading = false;
          error = failure.message;
        });
      },
      (backlogData) {
        setState(() {
          isLoading = false;
          backlog = backlogData;
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Set status bar to white and icons to dark
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.white, 
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
      ),
    );

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Project Backlog",
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: Color(0xFF181929),
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        top: true,
        child: Column(
          children: [
            // Content
            Expanded(
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
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _loadBacklog,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        )
                      : backlog == null || backlog!.epics.isEmpty
                          ? const Center(
                              child: Text(
                                'No backlog items found',
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontSize: 16,
                                ),
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              itemCount: backlog!.epics.length,
                              itemBuilder: (context, index) {
                                return _EpicCard(epic: backlog!.epics[index]);
                              },
                            ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EpicCard extends StatefulWidget {
  final Epic epic;

  const _EpicCard({required this.epic});

  @override
  State<_EpicCard> createState() => _EpicCardState();
}

class _EpicCardState extends State<_EpicCard> {
  bool isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!, width: 1),
      ),
      child: Column(
        children: [
          // Epic header
          InkWell(
            onTap: () {
              setState(() {
                isExpanded = !isExpanded;
              });
            },
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: Colors.black54,
                  ),
                  const SizedBox(width: 8),
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
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.epic.title,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                            color: Colors.black,
                          ),
                        ),
                        if (widget.epic.description.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            widget.epic.description,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Colors.black54,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: widget.epic.isComplete ? Colors.green : Colors.orange,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      widget.epic.isComplete ? 'Complete' : 'In Progress',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Expanded content
          if (isExpanded)
            Padding(
              padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
              child: Column(
                children: widget.epic.subEpics.map((subEpic) => 
                  _SubEpicCard(subEpic: subEpic)
                ).toList(),
              ),
            ),
        ],
      ),
    );
  }
}

class _SubEpicCard extends StatefulWidget {
  final SubEpic subEpic;

  const _SubEpicCard({required this.subEpic});

  @override
  State<_SubEpicCard> createState() => _SubEpicCardState();
}

class _SubEpicCardState extends State<_SubEpicCard> {
  bool isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!, width: 1),
      ),
      child: Column(
        children: [
          // Sub-Epic header
          InkWell(
            onTap: () {
              setState(() {
                isExpanded = !isExpanded;
              });
            },
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Icon(
                    isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: Colors.black54,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
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
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      widget.subEpic.title,
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
                      color: widget.subEpic.isComplete ? Colors.green : Colors.orange,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      widget.subEpic.isComplete ? 'Complete' : 'In Progress',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Expanded content
          if (isExpanded)
            Padding(
              padding: const EdgeInsets.only(left: 12, right: 12, bottom: 12),
              child: Column(
                children: widget.subEpic.userStories.map((userStory) => 
                  _UserStoryCard(userStory: userStory)
                ).toList(),
              ),
            ),
        ],
      ),
    );
  }
}

class _UserStoryCard extends StatefulWidget {
  final UserStory userStory;

  const _UserStoryCard({required this.userStory});

  @override
  State<_UserStoryCard> createState() => _UserStoryCardState();
}

class _UserStoryCardState extends State<_UserStoryCard> {
  bool isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.grey[200]!, width: 1),
      ),
      child: Column(
        children: [
          // User Story header
          InkWell(
            onTap: () {
              setState(() {
                isExpanded = !isExpanded;
              });
            },
            borderRadius: BorderRadius.circular(6),
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Row(
                children: [
                  Icon(
                    isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: Colors.black54,
                    size: 18,
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.green,
                      borderRadius: BorderRadius.circular(3),
                    ),
                    child: const Text(
                      'STORY',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 9,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      widget.userStory.title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: Colors.black,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                    decoration: BoxDecoration(
                      color: widget.userStory.isComplete ? Colors.green : Colors.orange,
                      borderRadius: BorderRadius.circular(3),
                    ),
                    child: Text(
                      widget.userStory.isComplete ? 'Complete' : 'In Progress',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 9,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Expanded content
          if (isExpanded)
            Padding(
              padding: const EdgeInsets.only(left: 10, right: 10, bottom: 10),
              child: Column(
                children: widget.userStory.tasks.map((task) => 
                  _TaskCard(task: task)
                ).toList(),
              ),
            ),
        ],
      ),
    );
  }
}

class _TaskCard extends StatelessWidget {
  final BacklogTask task;

  const _TaskCard({required this.task});

  Color _getStatusColor() {
    switch (task.status.toLowerCase()) {
      case "done":
        return Colors.green;
      case "in progress":
        return Colors.blue;
      case "pending":
      case "to do":
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: Colors.grey[200]!, width: 1),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.blue,
              borderRadius: BorderRadius.circular(3),
            ),
            child: const Text(
              'TASK',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 8,
              ),
            ),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                    color: Colors.black,
                  ),
                ),
                if (task.assigneeDetails != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    'Assignee: ${task.assigneeDetails!.userName ?? task.assigneeDetails!.userEmail ?? 'Unknown'}',
                    style: const TextStyle(
                      fontSize: 10,
                      color: Colors.black54,
                    ),
                  ),
                ],
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            decoration: BoxDecoration(
              color: _getStatusColor(),
              borderRadius: BorderRadius.circular(3),
            ),
            child: Text(
              task.status,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 9,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
