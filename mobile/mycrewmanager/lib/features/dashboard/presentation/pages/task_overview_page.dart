import 'package:flutter/material.dart';

class TaskOverviewPage extends StatefulWidget {
  const TaskOverviewPage({super.key});

  static Route<Object?> route() => MaterialPageRoute(builder: (_) => const TaskOverviewPage());

  @override
  State<TaskOverviewPage> createState() => _TaskOverviewPageState();
}

class _TaskOverviewPageState extends State<TaskOverviewPage> {
  String search = '';

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
                              const Text(
                                "Implementing Mobile App Pages",
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 20,
                                  color: Colors.black,
                                ),
                              ),
                              const SizedBox(height: 8),
                              // Task description
                              const Text(
                                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                                style: TextStyle(
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
                                children: const [
                                  Text(
                                    "Status:",
                                    style: TextStyle(fontWeight: FontWeight.w500, color: Colors.black54),
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    "TO DO",
                                    style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black),
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
                                  Text(
                                    "Assignee",
                                    style: TextStyle(fontWeight: FontWeight.w500, color: Colors.black54),
                                  ),
                                  SizedBox(width: 8),
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundImage: NetworkImage('https://randomuser.me/api/portraits/women/22.jpg'),
                                  ),
                                  SizedBox(width: 6),
                                  Text(
                                    "Angel Kimberly",
                                    style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 24),
                              // Mark as Completed Button
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.blue,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                  onPressed: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Task marked as completed!')),
                                    );
                                  },
                                  child: const Text(
                                    "Mark as Completed",
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                              ),
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