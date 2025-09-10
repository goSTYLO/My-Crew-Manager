import 'package:flutter/material.dart';

class TasksPage extends StatefulWidget {
  const TasksPage({super.key});

  @override
  State<TasksPage> createState() => _TasksPageState();

  static Route<Object?> route() => MaterialPageRoute(builder: (_) => const TasksPage());
}

class _TasksPageState extends State<TasksPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<Map<String, dynamic>> tasks = [
    {
      "title": "API Integration for Project A",
      "subtitle": "Sprint 1 • Backend",
      "status": "To Do",
      "icon": Icons.trending_up,
      "iconColor": Colors.red,
      "members": [
        "https://randomuser.me/api/portraits/men/32.jpg",
        "https://randomuser.me/api/portraits/women/44.jpg",
        "https://randomuser.me/api/portraits/men/65.jpg",
        "https://randomuser.me/api/portraits/women/68.jpg",
      ],
      "progress": 0.0,
    },
    {
      "title": "Code Review for Project A",
      "subtitle": "Sprint 1 • Backend",
      "status": "Completed",
      "icon": Icons.trending_up,
      "iconColor": Colors.red,
      "members": [
        "https://randomuser.me/api/portraits/men/32.jpg",
        "https://randomuser.me/api/portraits/women/44.jpg",
      ],
      "progress": 1.0,
    },
    {
      "title": "UI Design for Project A",
      "subtitle": "Sprint 1 • Design",
      "status": "In Progress",
      "icon": Icons.trending_up,
      "iconColor": Colors.red,
      "members": [
        "https://randomuser.me/api/portraits/men/32.jpg",
        "https://randomuser.me/api/portraits/women/44.jpg",
      ],
      "progress": 0.6,
    },
    {
      "title": "Backend Initialization",
      "subtitle": "Sprint 1 • Backend",
      "status": "Completed",
      "icon": Icons.drag_indicator,
      "iconColor": Colors.amber,
      "members": [
        "https://randomuser.me/api/portraits/men/32.jpg",
        "https://randomuser.me/api/portraits/women/44.jpg",
        "https://randomuser.me/api/portraits/men/65.jpg",
      ],
      "progress": 1.0,
    },
    {
      "title": "Redesign Application Logo",
      "subtitle": "Sprint 2 • Design",
      "status": "To Do",
      "icon": Icons.trending_up,
      "iconColor": Colors.red,
      "members": [
        "https://randomuser.me/api/portraits/men/32.jpg",
      ],
      "progress": 0.0,
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> getFilteredTasks(String status) {
    if (status == "All") return tasks;
    return tasks.where((t) => t["status"] == status).toList();
  }

  @override
  Widget build(BuildContext context) {
    final tabLabels = ["All", "To Do", "In Progress", "Completed"];
    return Scaffold(
      backgroundColor: const Color(0xFF17603A),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Tasks",
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Colors.black87),
            onPressed: () {
              // Implement search functionality here
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Search tapped')),
              );
            },
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: Colors.black,
              unselectedLabelColor: Colors.black38,
              indicatorColor: const Color(0xFF17603A),
              labelStyle: const TextStyle(fontWeight: FontWeight.w700),
              tabs: tabLabels.map((e) => Tab(text: e)).toList(),
            ),
          ),
        ),
      ),
      body: Container(
        color: const Color(0xFFF7F8FA),
        child: TabBarView(
          controller: _tabController,
          children: tabLabels.map((tab) {
            final filtered = getFilteredTasks(tab);
            return ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
              itemCount: filtered.length,
              itemBuilder: (context, i) {
                final t = filtered[i];
                return _TaskCard(
                  title: t["title"],
                  subtitle: t["subtitle"],
                  status: t["status"],
                  icon: t["icon"],
                  iconColor: t["iconColor"],
                  members: t["members"],
                  progress: t["progress"],
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Tapped: ${t["title"]}')),
                    );
                  },
                );
              },
            );
          }).toList(),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.black,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20), // for a rounded square look
        ),
        child: const Icon(Icons.add, color: Colors.white, size: 32),
        onPressed: () {
          // Implement add task functionality here
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Add Task tapped')),
          );
        },
      ),
    );
  }
}

class _TaskCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String status;
  final IconData icon;
  final Color iconColor;
  final List<String> members;
  final double progress;
  final VoidCallback? onTap;

  const _TaskCard({
    required this.title,
    required this.subtitle,
    required this.status,
    required this.icon,
    required this.iconColor,
    required this.members,
    required this.progress,
    this.onTap,
  });

  Color getStatusColor() {
    switch (status) {
      case "Completed":
        return Colors.green;
      case "In Progress":
        return Colors.amber;
      case "To Do":
      default:
        return Colors.black38;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 18), // Space between boxes
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.black12, width: 1),
        // Optional: add a subtle shadow
        // boxShadow: [
        //   BoxShadow(
        //     color: Colors.black.withOpacity(0.03),
        //     blurRadius: 8,
        //     offset: const Offset(0, 2),
        //   ),
        // ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: title and status
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 19,
                      color: Color(0xFF181929),
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: getStatusColor().withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(
                      color: getStatusColor(),
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Icon and subtitle
            Row(
              children: [
                Icon(icon, color: iconColor, size: 22),
                const SizedBox(width: 8),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    color: Color(0xFF181929),
                  ),
                ),
                const Spacer(),
                // Avatars
                SizedBox(
                  width: 50,
                  height: 28,
                  child: Stack(
                    children: [
                      for (int i = 0; i < members.length; i++)
                        Positioned(
                          left: i * 18,
                          child: Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.white, width: 2),
                              shape: BoxShape.circle,
                            ),
                            child: ClipOval(
                              child: Image.network(
                                members[i],
                                fit: BoxFit.cover,
                                width: 28,
                                height: 28,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Text(
              "Assigned Members",
              style: TextStyle(
                color: Colors.black54,
                fontSize: 13,
                fontWeight: FontWeight.w400,
              ),
            ),
            const SizedBox(height: 8),
            // Progress bar
            LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: const Color(0xFFE8ECF4),
              valueColor: AlwaysStoppedAnimation<Color>(
                status == "Completed" ? Colors.green : status == "In Progress" ? Colors.amber : Colors.black26,
              ),
            ),
          ],
        ),
      ),
    );
  }
}