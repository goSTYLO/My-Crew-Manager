import 'package:flutter/material.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/project_overview_page.dart';

class ManageMembersPage extends StatefulWidget {
  const ManageMembersPage({super.key});

  static Route<Object?> route() => MaterialPageRoute(builder: (_) => const ManageMembersPage());

  @override
  State<ManageMembersPage> createState() => _ManageMembersPageState();
}

class _ManageMembersPageState extends State<ManageMembersPage> {
  String search = '';

  final List<Map<String, String>> members = [
    {
      'name': 'You',
      'role': 'Project Lead',
      'avatar': 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    {
      'name': 'Angel Kimberly',
      'role': 'Front-end Developer',
      'avatar': 'https://randomuser.me/api/portraits/women/22.jpg',
    },
    {
      'name': 'Jason Statham',
      'role': 'Designer',
      'avatar': 'https://randomuser.me/api/portraits/men/2.jpg',
    },
    {
      'name': 'Jason Momoa',
      'role': 'Back-end Developer',
      'avatar': 'https://randomuser.me/api/portraits/men/11.jpg',
    },
    {
      'name': 'Jeremy Zucker',
      'role': 'AI Engineer',
      'avatar': 'https://randomuser.me/api/portraits/men/12.jpg',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final filtered = members
        .where((m) => m['name']!.toLowerCase().contains(search.toLowerCase()))
        .toList();

    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 255, 255, 255),
      body: SafeArea(
        child: Container(
          color: Colors.white,
          child: Column(
            children: [
              // Top bar
              Padding(
                padding: const EdgeInsets.only(left: 8, top: 8, right: 8, bottom: 0),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black87),
                      onPressed: () {
                        Navigator.of(context).pushReplacement(ProjectOverviewPage.route());
                      },
                    ),
                    const Spacer(),
                  ],
                ),
              ),
              const SizedBox(height: 2),
              // Title
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24.0, vertical: 4),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Project Team',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF181929),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              // Search bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Search Projects',
                    prefixIcon: const Icon(Icons.search),
                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: Color(0xFFE8ECF4),
                      ),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                    isDense: true,
                  ),
                  onChanged: (val) => setState(() => search = val),
                ),
              ),
              const SizedBox(height: 16),
              // Project avatar and name
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundImage: AssetImage('lib/core/assets/images/app_logo.png'),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'My Crew Tasker',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 17,
                        color: Colors.black,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // Members list
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 0),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const Divider(indent: 80, endIndent: 16, height: 1),
                  itemBuilder: (context, i) {
                    final m = filtered[i];
                    return ListTile(
                      leading: CircleAvatar(
                        radius: 28,
                        backgroundImage: NetworkImage(m['avatar']!),
                      ),
                      title: Text(
                        m['name']!,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                          color: Colors.black,
                        ),
                      ),
                      subtitle: Text(
                        m['role']!,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.black54,
                        ),
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.more_horiz, color: Colors.black87),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('More options for ${m['name']}')),
                          );
                        },
                      ),
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Tapped: ${m['name']}')),
                        );
                      },
                    );
                  },
                ),
              ),
              // Add Member button
              Padding(
                padding: const EdgeInsets.only(bottom: 24, right: 16, top: 8),
                child: Align(
                  alignment: Alignment.bottomRight,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    ),
                    icon: const Icon(Icons.add),
                    label: const Text('Add Member', style: TextStyle(fontWeight: FontWeight.w600)),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Add Member tapped')),
                      );
                    },
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