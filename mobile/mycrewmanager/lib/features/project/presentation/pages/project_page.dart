import 'package:flutter/material.dart';
import 'package:mycrewmanager/features/project/presentation/pages/create_project_page.dart';
import 'package:mycrewmanager/features/project/presentation/pages/upload_proposal_tab.dart';

class ProjectPage extends StatefulWidget {

  static route() => MaterialPageRoute(builder: (context) => ProjectPage());
  const ProjectPage({super.key});

  @override
  State<ProjectPage> createState() => _ProjectPageState();
}

class _ProjectPageState extends State<ProjectPage> {
  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          centerTitle: true,
          elevation: 0,
          backgroundColor: Colors.white,
          foregroundColor: Colors.black87,
          title: const Text('Project/Proposal'),
          actions: [
            IconButton(
              icon: const Icon(Icons.notifications_none_rounded),
              onPressed: () {},
              tooltip: 'Notifications',
            ),
          ],
          bottom: const TabBar( 
            labelColor: Colors.blue,
            unselectedLabelColor: Colors.black54,
            indicatorColor: Colors.blue,
            tabs: [
              Tab(text: 'Create Project'),
              Tab(text: 'Upload Proposal'),
            ],
          ),
        ),
        backgroundColor: const Color(0xFFF7F8FA),
        body: const TabBarView(children: [CreateProjectPage(), UploadProposalTab()]),
      ),
    );
  }
}