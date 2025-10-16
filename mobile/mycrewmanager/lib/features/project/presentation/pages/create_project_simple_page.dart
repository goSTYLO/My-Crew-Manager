import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'package:mycrewmanager/features/project/presentation/pages/upload_analyze_page.dart';

class CreateProjectSimplePage extends StatefulWidget {
  const CreateProjectSimplePage({super.key});

  static Route<Object?> route() => MaterialPageRoute(builder: (_) => const CreateProjectSimplePage());

  @override
  State<CreateProjectSimplePage> createState() => _CreateProjectSimplePageState();
}

class _CreateProjectSimplePageState extends State<CreateProjectSimplePage> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _summaryController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _summaryController.dispose();
    super.dispose();
  }

  Future<void> _createProject() async {
    if (_titleController.text.trim().isEmpty || _summaryController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter title and summary')));
      return;
    }
    setState(() => _submitting = true);
    try {
      final dio = GetIt.I<Dio>();
      final res = await dio.post('ai/projects/', data: {
        'title': _titleController.text.trim(),
        'summary': _summaryController.text.trim(),
      });
      final data = res.data as Map<String, dynamic>;
      final int projectId = data['id'] as int;
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        UploadAnalyzePage.route(projectId: projectId, initialTitle: _titleController.text.trim()),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to create: $e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Project'),
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
            const Text('Project Title', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Enter title'),
            ),
            const SizedBox(height: 12),
            const Text('Project Summary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            TextField(
              controller: _summaryController,
              maxLines: 4,
              decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Describe the project'),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submitting ? null : _createProject,
                child: _submitting
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Create Project'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


