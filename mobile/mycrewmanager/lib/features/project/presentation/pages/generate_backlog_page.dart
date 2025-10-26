import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:mycrewmanager/features/project/data/data_sources/project_remote.dart';
import 'package:dio/dio.dart';
import 'package:mycrewmanager/features/project/data/models/member_model.dart';
import 'package:mycrewmanager/features/project/data/models/task_model.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/projects_page.dart';

class GenerateBacklogPage extends StatefulWidget {
  final int projectId;
  const GenerateBacklogPage({super.key, required this.projectId});

  static Route<Object?> route({required int projectId}) =>
      MaterialPageRoute(builder: (_) => GenerateBacklogPage(projectId: projectId));

  @override
  State<GenerateBacklogPage> createState() => _GenerateBacklogPageState();
}

class _GenerateBacklogPageState extends State<GenerateBacklogPage> {
  bool _loading = false;
  String? _status;

  ProjectRemoteDataSource get _remote => GetIt.I<ProjectRemoteDataSource>();

  List<MemberModel> _members = [];
  List<TaskModel> _tasks = [];
  final TextEditingController _emailController = TextEditingController();
  String _newMemberRole = 'Member';
  List<String> _availableRoles = const ['Member', 'Project Manager', 'AI Engineer', 'Frontend Developer', 'Backend Developer', 'UI/UX Designer', 'QA Engineer'];
  final Map<int, int> _taskIdToMemberId = {}; // taskId -> memberId

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _generateBacklog() async {
    setState(() {
      _loading = true;
      _status = 'Starting backlog generation...';
    });
    // Blocking spinner
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );
    // Extend HTTP timeouts for long LLM run
    final dio = GetIt.I<Dio>();
    final prevConnect = dio.options.connectTimeout;
    final prevReceive = dio.options.receiveTimeout;
    dio.options = dio.options.copyWith(
      connectTimeout: const Duration(minutes: 2),
      receiveTimeout: const Duration(minutes: 15),
    );
    try {
      await _remote.generateBacklog(widget.projectId);
      if (mounted) {
        setState(() => _status = 'Backlog generated successfully');
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Backlog generated')));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _status = 'Failed to generate backlog: $e');
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Generate failed: $e')));
      }
    } finally {
      // Restore timeouts and close dialog
      dio.options = dio.options.copyWith(connectTimeout: prevConnect, receiveTimeout: prevReceive);
      if (mounted && Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      }
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadMembersAndTasks() async {
    setState(() => _loading = true);
    try {
      final members = await _remote.getProjectMembers(widget.projectId);
      final tasks = await _remote.getProjectTasks(widget.projectId);
      final roles = await _remote.getProjectRoles(widget.projectId);
      if (mounted) {
        setState(() {
          _members = members;
          _tasks = tasks;
          if (roles.isNotEmpty) {
            _availableRoles = roles;
            if (!_availableRoles.contains(_newMemberRole)) {
              _newMemberRole = _availableRoles.first;
            }
          }
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Load failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _addMember() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter email')));
      return;
    }
    setState(() => _loading = true);
    try {
      await _remote.addProjectMember(projectId: widget.projectId, email: email, role: _newMemberRole);
      _emailController.clear();
      await _loadMembersAndTasks();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Member added')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Add failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveAssignments() async {
    if (_loading) return;
    final assignments = _taskIdToMemberId.entries
        .where((e) => e.value != 0)
        .map((e) => {"task_id": e.key, "assignee_id": e.value})
        .toList();
    if (assignments.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No assignments to save')));
      return;
    }
    setState(() => _loading = true);
    try {
      final updated = await _remote.bulkAssignTasks(assignments);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Saved $updated assignments')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Save failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Generate Backlog'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      backgroundColor: Colors.white,
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Backlog Generation', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: _loading ? null : _generateBacklog,
                child: const Text('Generate Backlog Now'),
              ),
              const SizedBox(height: 8),
              if (_loading) const LinearProgressIndicator(),
              if (_status != null) Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(_status!, style: const TextStyle(color: Colors.black87)),
              ),

              const Divider(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Team Members', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  IconButton(onPressed: _loading ? null : _loadMembersAndTasks, icon: const Icon(Icons.refresh))
                ],
              ),
              Row(children: [
                Expanded(
                  child: TextField(
                    controller: _emailController,
                    decoration: const InputDecoration(labelText: 'Member email', border: OutlineInputBorder()),
                  ),
                ),
                const SizedBox(width: 12),
                DropdownButton<String>(
                  value: _newMemberRole,
                  items: _availableRoles.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                  onChanged: (v) => setState(() => _newMemberRole = v ?? _newMemberRole),
                ),
                const SizedBox(width: 12),
                ElevatedButton(onPressed: _loading ? null : _addMember, child: const Text('Add')),
              ]),
              const SizedBox(height: 12),
              if (_members.isNotEmpty)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _members.map((m) => Chip(label: Text('${m.name.isNotEmpty ? m.name : m.email} • ${m.role}'))).toList(),
                ),

              const Divider(height: 32),
              const Text('Assign Tasks', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 8),
              if (_tasks.isEmpty)
                const Text('No tasks loaded yet. Generate backlog, then Refresh.'),
              if (_tasks.isNotEmpty)
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _tasks.length,
                  itemBuilder: (context, index) {
                    final t = _tasks[index];
                    final selectedMemberId = _taskIdToMemberId[t.id];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border.all(color: Colors.grey[300]!),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Expanded(child: Text(t.title, style: const TextStyle(fontSize: 14))),
                          const SizedBox(width: 12),
                          DropdownButton<int>(
                            value: selectedMemberId,
                            hint: const Text('Assign to'),
                            items: _members.map((m) => DropdownMenuItem(value: m.id, child: Text(m.name.isNotEmpty ? m.name : m.email))).toList(),
                            onChanged: (v) => setState(() => _taskIdToMemberId[t.id] = v ?? 0),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              const SizedBox(height: 8),
              Row(
                children: [
                  ElevatedButton(onPressed: _loading ? null : _loadMembersAndTasks, child: const Text('Refresh')),
                  const SizedBox(width: 12),
                  ElevatedButton(onPressed: _loading ? null : _saveAssignments, child: const Text('Save Assignments')),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    onPressed: _loading
                        ? null
                        : () {
                            // Finalize flow: return to Projects list
                            Navigator.pushAndRemoveUntil(
                              context,
                              ProjectsPage.route(),
                              (route) => false,
                            );
                          },
                    child: const Text('Finish'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}


