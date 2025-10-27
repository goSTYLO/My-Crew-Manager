import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:http/http.dart' as http;
import 'package:mycrewmanager/features/dashboard/presentation/pages/manage_members_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/tasks_page.dart';
import 'package:mycrewmanager/features/project/presentation/pages/project_backlog_page.dart';
import 'package:mycrewmanager/features/project/domain/entities/project.dart';
import 'package:mycrewmanager/features/project/domain/entities/member.dart';
import 'package:mycrewmanager/features/project/domain/usecases/get_project_members.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/init_dependencies.dart';
import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:mycrewmanager/core/tokenhandlers/token_storage.dart';

class ProjectOverviewPage extends StatefulWidget {
  final Project? project;
  
  const ProjectOverviewPage({super.key, this.project});

  static Route<Object?> route([Project? project]) => MaterialPageRoute(
    builder: (_) => ProjectOverviewPage(project: project)
  );

  @override
  State<ProjectOverviewPage> createState() => _ProjectOverviewPageState();
}

class _ProjectOverviewPageState extends State<ProjectOverviewPage> {
  List<Member> members = [];
  bool isLoadingMembers = true;
  String? membersError;

  // Statistics state
  int taskCount = 0;
  int sprintCount = 0;
  bool isLoadingStatistics = true;
  String? statisticsError;

  final GetProjectMembers _getProjectMembers = serviceLocator<GetProjectMembers>();
  final TokenStorage _tokenStorage = serviceLocator<TokenStorage>();

  @override
  void initState() {
    super.initState();
    _loadMembers();
    _loadStatistics();
  }

  Future<void> _loadMembers() async {
    if (widget.project == null) {
      setState(() {
        isLoadingMembers = false;
        membersError = 'No project selected';
      });
      return;
    }

    setState(() {
      isLoadingMembers = true;
      membersError = null;
    });

    final result = await _getProjectMembers(GetProjectMembersParams(
      projectId: widget.project!.id,
    ));

    result.fold(
      (failure) {
        setState(() {
          isLoadingMembers = false;
          membersError = failure.message;
        });
      },
      (membersList) {
        setState(() {
          isLoadingMembers = false;
          members = membersList;
        });
      },
    );
  }

  Future<void> _loadStatistics() async {
    if (widget.project == null) {
      setState(() {
        isLoadingStatistics = false;
        statisticsError = 'No project selected';
      });
      return;
    }

    setState(() {
      isLoadingStatistics = true;
      statisticsError = null;
    });

    try {
      final response = await http.get(
        Uri.parse('${Constants.baseUrl}ai/projects/${widget.project!.id}/statistics/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ${await _getAuthToken()}',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          isLoadingStatistics = false;
          taskCount = data['task_count'] ?? 0;
          sprintCount = data['sprint_count'] ?? 0;
        });
      } else {
        setState(() {
          isLoadingStatistics = false;
          statisticsError = 'Failed to load statistics';
        });
      }
    } catch (e) {
      setState(() {
        isLoadingStatistics = false;
        statisticsError = 'Error loading statistics: $e';
      });
    }
  }

  Future<String> _getAuthToken() async {
    final token = await _tokenStorage.getToken();
    return token ?? '';
  }

  String _getInitials(String name) {
    if (name.isEmpty) return '?';
    
    final words = name.trim().split(' ');
    if (words.length == 1) {
      return words[0].substring(0, 1).toUpperCase();
    } else {
      return (words[0].substring(0, 1) + words[1].substring(0, 1)).toUpperCase();
    }
  }

  Color _getColorFromString(String text) {
    final colors = [
      Colors.blue,
      Colors.purple,
      Colors.pink,
      Colors.green,
      Colors.orange,
      Colors.teal,
      Colors.indigo,
      Colors.red,
    ];
    
    int hash = text.hashCode;
    return colors[hash.abs() % colors.length];
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

    // Use default values if no project is provided
    final projectTitle = widget.project?.title ?? "My Crew Tasker";
    final projectSummary = widget.project?.summary ?? "MyCrewManager is an AI-driven project management system that automates task tracking, sprint progress monitoring, and developer well-being analysis.";
    final projectId = widget.project?.id ?? 0;
    final projectCreatedAt = widget.project?.createdAt ?? DateTime.now();

    return Scaffold(
      backgroundColor: Colors.white, 
      body: SafeArea(
        top: true,
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 0),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top bar
                Padding(
                  padding: const EdgeInsets.only(left: 8, top: 8),
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black87),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
                const Center(
                  child: Text(
                    "Project Overview",
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 24,
                      color: Color(0xFF181929),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                // Project avatar, name, status
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _ProjectAvatar(
                        projectName: projectTitle,
                        size: 76,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              projectTitle,
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 22,
                                color: Color(0xFF181929),
                                shadows: [
                                  Shadow(
                                    color: Colors.black26,
                                    offset: Offset(1, 2),
                                    blurRadius: 2,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.green.shade100,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                "Active",
                                style: TextStyle(
                                  color: Colors.green.shade700,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                // Description
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    projectSummary,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.black87,
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                // Dates
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Created Date",
                            style: TextStyle(fontSize: 13, color: Colors.black54),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _formatDate(projectCreatedAt),
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Project ID",
                            style: TextStyle(fontSize: 13, color: Colors.black54),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            "#${projectId}",
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                // Members
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    "Members",
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                      color: Colors.black,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: isLoadingMembers
                      ? const SizedBox(
                          height: 40,
                          child: Center(child: CircularProgressIndicator()),
                        )
                      : membersError != null
                          ? Text(
                              'Error loading members: $membersError',
                              style: const TextStyle(
                                color: Colors.red,
                                fontSize: 14,
                              ),
                            )
                          : members.isEmpty
                              ? const Text(
                                  'No members yet',
                                  style: TextStyle(
                                    color: Colors.grey,
                                    fontSize: 14,
                                  ),
                                )
                              : Row(
                                  children: [
                                    ...members.map((member) => Padding(
                                      padding: const EdgeInsets.only(right: 8),
                                      child: _MemberCircle(
                                        label: _getInitials(member.name),
                                        color: _getColorFromString(member.name),
                                      ),
                                    )),
                                  ],
                                ),
                ),
                const SizedBox(height: 18),
                // Sprint Progress
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: const [
                      Text(
                        "Sprint Progress",
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                          color: Colors.black,
                        ),
                      ),
                      Text(
                        "0% Completed",
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: Colors.black,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: LinearProgressIndicator(
                    value: 0.0,
                    minHeight: 7,
                    backgroundColor: Color(0xFFE8ECF4),
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
                  ),
                ),
                const SizedBox(height: 18),
                // Stats
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _StatBox(
                        label: isLoadingStatistics ? "..." : "$taskCount", 
                        sublabel: "Tasks"
                      ),
                      _StatBox(
                        label: isLoadingStatistics ? "..." : "$sprintCount", 
                        sublabel: "Sprints"
                      ),
                      _StatBox(label: "${members.length}", sublabel: "Members"),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                // Buttons
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                      side: const BorderSide(color: Colors.black, width: 1.2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.list_alt_rounded, color: Colors.black),
                    label: const Text(
                      "View Tasks",
                      style: TextStyle(color: Colors.black, fontWeight: FontWeight.w600, fontSize: 16),
                    ),
                    onPressed: () {
                      Navigator.of(context).push(TasksPage.route(widget.project));
                    },
                  ),
                ),
                const SizedBox(height: 12),
                // Manage Members button (hidden for developers)
                BlocBuilder<AuthBloc, AuthState>(
                  builder: (context, authState) {
                    // Check if user has developer role (case-insensitive)
                    bool isDeveloper = false;
                    if (authState is AuthSuccess) {
                      isDeveloper = authState.user.role?.toLowerCase() == 'developer';
                    }
                    
                    // Hide button for developers
                    if (isDeveloper) {
                      return const SizedBox.shrink();
                    }
                    
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                          side: const BorderSide(color: Colors.black, width: 1.2),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        icon: const Icon(Icons.settings, color: Colors.black),
                        label: const Text(
                          "Manage Members",
                          style: TextStyle(color: Colors.black, fontWeight: FontWeight.w600, fontSize: 16),
                        ),
                        onPressed: () {
                          Navigator.of(context).push(ManageMembersPage.route(widget.project));
                        },
                      ),
                    );
                  },
                ),
                const SizedBox(height: 12),
                // View Backlog button
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                      side: const BorderSide(color: Colors.black, width: 1.2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.list_alt_rounded, color: Colors.black),
                    label: const Text(
                      "View Backlog",
                      style: TextStyle(color: Colors.black, fontWeight: FontWeight.w600, fontSize: 16),
                    ),
                    onPressed: () {
                      Navigator.of(context).push(ProjectBacklogPage.route(widget.project));
                    },
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}

class _MemberCircle extends StatelessWidget {
  final String label;
  final Color color;
  final Color textColor;

  const _MemberCircle({
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: 20,
      backgroundColor: color,
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.w600,
          fontSize: 15,
        ),
      ),
    );
  }
}

class _ProjectAvatar extends StatelessWidget {
  final String projectName;
  final double size;

  const _ProjectAvatar({
    required this.projectName,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    final initials = _getProjectInitials(projectName);
    final backgroundColor = _getColorFromProjectName(projectName);
    
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: backgroundColor,
        boxShadow: [
          BoxShadow(
            color: backgroundColor.withOpacity(0.3),
            blurRadius: 8,
            spreadRadius: 2,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Center(
        child: Text(
          initials,
          style: TextStyle(
            fontSize: size * 0.4,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            letterSpacing: 1.2,
          ),
        ),
      ),
    );
  }

  String _getProjectInitials(String projectName) {
    if (projectName.isEmpty) return '?';
    
    final words = projectName.trim().split(' ');
    if (words.length == 1) {
      return words[0].substring(0, 1).toUpperCase();
    } else {
      return (words[0].substring(0, 1) + words[1].substring(0, 1)).toUpperCase();
    }
  }

  Color _getColorFromProjectName(String projectName) {
    final colors = [
      Colors.red,
      Colors.blue,
      Colors.purple,
      Colors.pink,
      Colors.green,
      Colors.orange,
      Colors.teal,
      Colors.indigo,
      Colors.deepPurple,
      Colors.cyan,
      Colors.amber,
      Colors.deepOrange,
    ];
    
    int hash = projectName.hashCode;
    return colors[hash.abs() % colors.length];
  }
}

class _StatBox extends StatelessWidget {
  final String label;
  final String sublabel;

  const _StatBox({
    required this.label,
    required this.sublabel,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.black26, width: 1),
          borderRadius: BorderRadius.circular(10),
          color: Colors.white,
        ),
        child: Column(
          children: [
            Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 18,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              sublabel,
              style: const TextStyle(
                fontSize: 13,
                color: Colors.black54,
              ),
            ),
          ],
        ),
      ),
    );
  }
}