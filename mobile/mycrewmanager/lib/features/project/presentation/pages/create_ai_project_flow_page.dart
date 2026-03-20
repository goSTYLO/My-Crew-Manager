import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'package:mycrewmanager/features/project/data/data_sources/project_remote.dart';

class CreateAIProjectFlowPage extends StatefulWidget {
  const CreateAIProjectFlowPage({super.key});

  static Route<Object?> route() =>
      MaterialPageRoute(builder: (_) => const CreateAIProjectFlowPage());

  @override
  State<CreateAIProjectFlowPage> createState() =>
      _CreateAIProjectFlowPageState();
}

class _CreateAIProjectFlowPageState extends State<CreateAIProjectFlowPage> {
  final _titleController = TextEditingController();
  final _summaryController = TextEditingController();
  final _llmDescriptionController = TextEditingController();
  final _llmRolesController = TextEditingController();
  final _llmTasksController = TextEditingController();
  final _memberEmailController = TextEditingController();
  String _memberRole = 'Member';

  int? _projectId;
  int? _proposalId;
  bool _loading = false;

  ProjectRemoteDataSource get _remote => GetIt.I<ProjectRemoteDataSource>();

  @override
  void dispose() {
    _titleController.dispose();
    _summaryController.dispose();
    _llmDescriptionController.dispose();
    _llmRolesController.dispose();
    _llmTasksController.dispose();
    _memberEmailController.dispose();
    super.dispose();
  }

  Future<void> _createProject() async {
    setState(() => _loading = true);
    try {
      final dio = GetIt.I<Dio>();
      final res = await dio.post('ai/projects/', data: {
        'title': _titleController.text.trim(),
        'summary': _summaryController.text.trim(),
      });
      setState(() {
        _projectId = (res.data as Map<String, dynamic>)['id'] as int;
      });
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _pickAndUploadProposal() async {
    if (_projectId == null) return;
    final result = await FilePicker.platform
        .pickFiles(type: FileType.custom, allowedExtensions: ['pdf']);
    if (result == null || result.files.isEmpty) return;
    final filePath = result.files.single.path;
    if (filePath == null) return;
    setState(() => _loading = true);
    try {
      final data = await _remote.uploadProposal(
          projectId: _projectId!, filePath: filePath);
      _proposalId = data['proposal_id'] as int;
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _ingestProposal() async {
    if (_projectId == null || _proposalId == null) return;
    setState(() => _loading = true);
    try {
      final data = await _remote.ingestProposal(
          projectId: _projectId!,
          proposalId: _proposalId!,
          titleOverride: _titleController.text.trim());
      final llm = data['llm'] as Map<String, dynamic>?;
      _llmDescriptionController.text = (llm?['summary'] ?? '').toString();
      final roles = (llm?['roles'] as List?)?.join('\n') ?? '';
      _llmRolesController.text = roles;
      final features = (llm?['features'] as List?)?.join('\n') ?? '';
      _llmTasksController.text = features;
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _generateBacklog() async {
    if (_projectId == null) return;
    setState(() => _loading = true);
    try {
      await _remote.generateBacklog(_projectId!);
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Backlog generated')));
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _saveEdits() async {
    if (_projectId == null) return;
    setState(() => _loading = true);
    try {
      await _remote.patchProject(
        projectId: _projectId!,
        title: _titleController.text.trim(),
        summary: _llmDescriptionController.text.trim(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Saved edits')));
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _addMember() async {
    if (_projectId == null) return;
    final email = _memberEmailController.text.trim();
    if (email.isEmpty) return;
    setState(() => _loading = true);
    try {
      await _remote.addProjectMember(
          projectId: _projectId!, email: email, role: _memberRole);
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Member added')));
        _memberEmailController.clear();
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Create AI Project'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Project Details',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(
                  labelText: 'Project Title', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _summaryController,
              maxLines: 3,
              decoration: const InputDecoration(
                  labelText: 'Project Summary', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                ElevatedButton(
                    onPressed: _loading ? null : _createProject,
                    child: const Text('Create Project')),
                const SizedBox(width: 12),
                if (_projectId != null)
                  Text('ID: $_projectId',
                      style: const TextStyle(color: Colors.black54)),
              ],
            ),
            const Divider(height: 32),
            const Text('Upload Proposal',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Row(children: [
              ElevatedButton(
                  onPressed: (_projectId == null || _loading)
                      ? null
                      : _pickAndUploadProposal,
                  child: const Text('Pick PDF')),
              const SizedBox(width: 12),
              if (_proposalId != null)
                Text('Proposal: $_proposalId',
                    style: const TextStyle(color: Colors.black54)),
            ]),
            const SizedBox(height: 8),
            ElevatedButton(
                onPressed:
                    (_projectId == null || _proposalId == null || _loading)
                        ? null
                        : _ingestProposal,
                child: const Text('Ingest and Generate Summary')),
            const Divider(height: 32),
            const Text('AI Summary (Editable)',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            TextField(
              controller: _llmDescriptionController,
              maxLines: 4,
              decoration: const InputDecoration(
                  labelText: 'Description', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _llmRolesController,
              maxLines: 4,
              decoration: const InputDecoration(
                  labelText: 'Roles (one per line)',
                  border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _llmTasksController,
              maxLines: 4,
              decoration: const InputDecoration(
                  labelText: 'Top Tasks/Features (one per line)',
                  border: OutlineInputBorder()),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                ElevatedButton(
                    onPressed:
                        (_projectId == null || _loading) ? null : _saveEdits,
                    child: const Text('Save Edits')),
                const SizedBox(width: 12),
                ElevatedButton(
                    onPressed: (_projectId == null || _loading)
                        ? null
                        : _generateBacklog,
                    child: const Text('Generate Backlog')),
              ],
            ),
            const SizedBox(height: 16),
            const Text('Assign Roles / Tasks',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            TextField(
              controller: _memberEmailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                  labelText: 'Member email', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _memberRole,
              items: const [
                DropdownMenuItem(value: 'Member', child: Text('Member')),
                DropdownMenuItem(
                    value: 'Project Manager', child: Text('Project Manager')),
                DropdownMenuItem(
                    value: 'AI Engineer', child: Text('AI Engineer')),
                DropdownMenuItem(
                    value: 'UX Designer', child: Text('UX Designer')),
                DropdownMenuItem(
                    value: 'Front-end Developer',
                    child: Text('Front-end Developer')),
                DropdownMenuItem(
                    value: 'Back-end Developer',
                    child: Text('Back-end Developer')),
                DropdownMenuItem(
                    value: 'Data Analyst', child: Text('Data Analyst')),
              ],
              onChanged: (v) => setState(() => _memberRole = v ?? 'Member'),
              decoration: const InputDecoration(
                  border: OutlineInputBorder(), labelText: 'Role'),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
                onPressed: (_projectId == null || _loading) ? null : _addMember,
                child: const Text('Add Member')),
            const SizedBox(height: 24),
            if (_loading) const Center(child: CircularProgressIndicator()),
          ],
        ),
      ),
    );
  }
}
