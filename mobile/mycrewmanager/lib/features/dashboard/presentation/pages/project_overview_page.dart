import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/manage_members_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/tasks_page.dart';
import 'package:mycrewmanager/features/project/domain/entities/project.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';

class ProjectOverviewPage extends StatelessWidget {
  final Project? project;
  
  const ProjectOverviewPage({super.key, this.project});

  static Route<Object?> route([Project? project]) => MaterialPageRoute(
    builder: (_) => ProjectOverviewPage(project: project)
  );

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
    final projectTitle = project?.title ?? "My Crew Tasker";
    final projectSummary = project?.summary ?? "MyCrewManager is an AI-driven project management system that automates task tracking, sprint progress monitoring, and developer well-being analysis.";
    final projectId = project?.id ?? 0;
    final projectCreatedAt = project?.createdAt ?? DateTime.now();

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
                      CircleAvatar(
                        radius: 38,
                        backgroundImage: AssetImage('lib/core/assets/images/app_logo.png'),
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
                  child: Row(
                    children: [
                      _MemberCircle(label: "LR", color: Colors.blue),
                      const SizedBox(width: 8),
                      _MemberCircle(label: "PB", color: Colors.purple),
                      const SizedBox(width: 8),
                      _MemberCircle(label: "TD", color: Colors.pink),
                      const SizedBox(width: 8),
                      _MemberCircle(label: "VB", color: Colors.green),
                      const SizedBox(width: 8),
                      _MemberCircle(label: "+", color: Colors.black26, textColor: Colors.black87),
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
                      _StatBox(label: "0", sublabel: "Tasks"),
                      _StatBox(label: "0", sublabel: "Sprints"),
                      _StatBox(label: "1", sublabel: "Members"),
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
                      Navigator.of(context).push(TasksPage.route(project));
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
                          Navigator.of(context).push(ManageMembersPage.route(project));
                        },
                      ),
                    );
                  },
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
    this.textColor = Colors.white,
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