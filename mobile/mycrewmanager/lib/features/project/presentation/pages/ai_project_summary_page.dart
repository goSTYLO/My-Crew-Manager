import 'package:flutter/material.dart';

class AIProjectSummaryPage extends StatelessWidget {
  const AIProjectSummaryPage({super.key});

  static Route<Object?> route() => MaterialPageRoute(builder: (_) => const AIProjectSummaryPage());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 12),
              const Text('AI Project Summary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
              const SizedBox(height: 16),
              _blueCard(
                child: const Text(
                  'The Project Nova aims to construct an intelligent automation platform that boosts team coordination and decision-making. It encompasses task management, progress tracking, and AI-driven insight generation.',
                  style: TextStyle(color: Colors.white, fontSize: 15),
                ),
              ),
              const SizedBox(height: 16),
              _blueCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Timeline', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    const Text('Week 1:\n- Develop Initial project plan\n- Identify and assess business needs\nWeek 2:\n- Define system requirements and specifications\n- Research and select AI models for insight generation', style: TextStyle(color: Colors.white, fontSize: 14)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        elevation: 0,
                      ),
                      onPressed: () {},
                      child: const Text('Go to Timeline'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _blueCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Roles', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    const Text('• Project Manager\n• AI Engineer\n• UX Designer\n• Full Stack Developer\n• Data Analyst\n• DevOps Engineer\n• Quality Assurance Engineer\n• Technical Writer\n• Product Manager\n• Business Analyst', style: TextStyle(color: Colors.white, fontSize: 14)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        elevation: 0,
                      ),
                      onPressed: () {},
                      child: const Text('Assign Roles'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _blueCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Task List', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    const Text('• Develop initial project plan — Project Manager\n• Define system requirements and specifications — Product Manager\n• Research and select AI models for insight generation — AI Engineer\n• Design user interface and user experience — UX Designer\n• Define system architecture and integration strategy — Full Stack Developer\n• Prepare necessary data for AI models — Data Analyst\n• Implement chosen AI models into the platform — AI Engineer\n• Develop platform frontend — Full Stack Developer\n• Develop platform backend — Full Stack Developer', style: TextStyle(color: Colors.white, fontSize: 14)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        elevation: 0,
                      ),
                      onPressed: () {},
                      child: const Text('Task Assignments'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text('Project Timeline', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 12),
              _timelineRow(Colors.purpleAccent, 'Project Initiation', 'Week 1'),
              _timelineRow(Colors.redAccent, 'Design Phase', 'Week 2 - 3'),
              _timelineRow(Colors.green, 'Development Phase', 'Week 4 - 7'),
              _timelineRow(Colors.amber, 'Testing & Deployment', 'Week 8 - 9'),
              const SizedBox(height: 24),
              const Text('Assign Roles', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 12),
              _roleCard('Project Manager', 'Alex'),
              _roleCard('UI/UX', 'Sarah'),
              _roleCard('Front-end Developer', 'David'),
              _addRoleCard(),
              const SizedBox(height: 24),
              const Text('Tasks Assignments', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 12),
              _taskCard(context, 'Alex', 'Implement use authentication API', 'assets/images/profile1.png'),
              _taskCard(context, 'Sarah', 'Design user authentication flow', 'assets/images/profile2.png'),
              _taskCard(context, 'David', 'Prepare necessary data for AI Models', 'assets/images/profile3.png'),
              _addTaskCard(context),
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey[300],
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Export', style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        // Link and generate backlog
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Link and Generate Backlog', style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _blueCard({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue,
        borderRadius: BorderRadius.circular(12),
      ),
      child: child,
    );
  }

  Widget _timelineRow(Color color, String title, String week) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.circle, color: Colors.white, size: 12),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(title, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 15)),
          ),
          Text(week, style: const TextStyle(color: Colors.grey, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _roleCard(String role, String name) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(role, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                Text('Assign to: $name', style: const TextStyle(fontSize: 13, color: Colors.grey)),
              ],
            ),
          ),
          const Icon(Icons.edit, color: Colors.grey, size: 18),
        ],
      ),
    );
  }

  Widget _addRoleCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text('Add Team Member', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          ),
          const Icon(Icons.add, color: Colors.grey, size: 20),
        ],
      ),
    );
  }

  void _showAssignTaskSheet(BuildContext context, {String? name, String? task, String? imagePath}) {
    final TextEditingController emailController = TextEditingController(text: name ?? '');
    final TextEditingController roleController = TextEditingController(text: task ?? '');
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 16,
            right: 16,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const Text("Add Team Member", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 16),
              TextField(
                controller: emailController,
                decoration: InputDecoration(
                  labelText: "Email Address",
                  prefixIcon: Icon(Icons.email_outlined),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: roleController.text.isNotEmpty ? roleController.text : null,
                items: const [
                  DropdownMenuItem(value: 'Front-end Developer', child: Text('Front-end Developer')),
                  DropdownMenuItem(value: 'Back-end Developer', child: Text('Back-end Developer')),
                  DropdownMenuItem(value: 'AI Engineer', child: Text('AI Engineer')),
                  DropdownMenuItem(value: 'UX Designer', child: Text('UX Designer')),
                  DropdownMenuItem(value: 'Product Manager', child: Text('Product Manager')),
                ],
                onChanged: (val) {
                  roleController.text = val ?? '';
                },
                decoration: InputDecoration(
                  labelText: "Role",
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        // Add member logic here
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text("Add Member", style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey[300],
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text("Cancel", style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _taskCard(BuildContext context, String name, String task, String imagePath) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundImage: AssetImage(imagePath),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                Text(task, style: const TextStyle(fontSize: 13, color: Colors.grey)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.edit, color: Colors.grey, size: 18),
            onPressed: () {
              _showAssignTaskSheet(context, name: name, task: task, imagePath: imagePath);
            },
          ),
        ],
      ),
    );
  }

  Widget _addTaskCard(BuildContext context) {
    return InkWell(
      onTap: () {
        _showAssignTaskSheet(context);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text('Assign Team Member', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            ),
            const Icon(Icons.add, color: Colors.grey, size: 20),
          ],
        ),
      ),
    );
  }

}
