import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:mycrewmanager/features/project/data/data_sources/project_remote.dart';
import 'package:mycrewmanager/features/project/presentation/pages/generate_backlog_page.dart';
import 'package:dio/dio.dart';

class UploadAnalyzePage extends StatefulWidget {
  final int projectId;
  final String? initialTitle;
  const UploadAnalyzePage({super.key, required this.projectId, this.initialTitle});

  static Route<Object?> route({required int projectId, String? initialTitle}) =>
      MaterialPageRoute(builder: (_) => UploadAnalyzePage(projectId: projectId, initialTitle: initialTitle));

  @override
  State<UploadAnalyzePage> createState() => _UploadAnalyzePageState();
}

class _UploadAnalyzePageState extends State<UploadAnalyzePage> {
  final TextEditingController _summaryController = TextEditingController();
  final TextEditingController _rolesController = TextEditingController();
  final TextEditingController _tasksController = TextEditingController();

  bool _loading = false;
  int? _proposalId;
  bool _hasAnalysis = false;

  ProjectRemoteDataSource get _remote => GetIt.I<ProjectRemoteDataSource>();

  @override
  void dispose() {
    _summaryController.dispose();
    _rolesController.dispose();
    _tasksController.dispose();
    super.dispose();
  }

  Future<void> _pickAndUpload() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['pdf']);
    if (result == null || result.files.isEmpty) return;
    final filePath = result.files.single.path;
    if (filePath == null) return;
    setState(() => _loading = true);
    try {
      final data = await _remote.uploadProposal(projectId: widget.projectId, filePath: filePath);
      _proposalId = data['proposal_id'] as int?;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Uploaded proposal')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _analyze() async {
    setState(() => _loading = true);
    // Show blocking progress dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );
    // Temporarily extend HTTP timeouts for long-running LLM
    final dio = GetIt.I<Dio>();
    final prevConnect = dio.options.connectTimeout;
    final prevReceive = dio.options.receiveTimeout;
    dio.options = dio.options.copyWith(
      connectTimeout: const Duration(minutes: 2),
      receiveTimeout: const Duration(minutes: 10),
    );
    try {
      final data = await _remote.ingestProposal(
        projectId: widget.projectId,
        proposalId: _proposalId ?? -1,
        titleOverride: widget.initialTitle,
      );
      final llm = data['llm'] as Map<String, dynamic>?;
      _summaryController.text = (llm?['summary'] ?? '').toString();
      _rolesController.text = ((llm?['roles'] as List?) ?? []).join('\n');
      _tasksController.text = ((llm?['features'] as List?) ?? []).join('\n');
      _hasAnalysis = true;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Analysis complete')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Analyze failed: $e')));
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

  Future<void> _saveSummary() async {
    if (_loading) return;
    setState(() => _loading = true);
    try {
      await _remote.patchProject(
        projectId: widget.projectId,
        title: widget.initialTitle,
        summary: _summaryController.text.trim(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Summary saved')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Save failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _goToGenerate() {
    if (_loading) return;
    Navigator.push(context, GenerateBacklogPage.route(projectId: widget.projectId));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Upload & Analyze'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              ElevatedButton(onPressed: _loading ? null : _pickAndUpload, child: const Text('Upload PDF')),
              const SizedBox(width: 12),
              ElevatedButton(onPressed: _loading ? null : _analyze, child: const Text('Analyze')),
            ]),
            if (_proposalId != null) Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text('Proposal ID: $_proposalId', style: const TextStyle(color: Colors.black54)),
            ),

            const Divider(height: 32),
            const Text('AI Summary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            TextField(
              controller: _summaryController,
              maxLines: 4,
              decoration: const InputDecoration(border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            const Text('Roles', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            TextField(
              controller: _rolesController,
              maxLines: 4,
              decoration: const InputDecoration(border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            const Text('Top Tasks/Features', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            TextField(
              controller: _tasksController,
              maxLines: 4,
              decoration: const InputDecoration(border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            if (_hasAnalysis) Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _loading ? null : _saveSummary,
                    child: const Text('Save'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _loading ? null : _goToGenerate,
                    child: const Text('Generate Backlog'),
                  ),
                ),
              ],
            ),
            if (_hasAnalysis) const SizedBox(height: 16),
            if (_loading) const Center(child: CircularProgressIndicator()),
          ],
        ),
      ),
    );
  }
}


