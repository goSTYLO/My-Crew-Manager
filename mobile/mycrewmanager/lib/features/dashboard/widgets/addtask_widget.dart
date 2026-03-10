import 'package:flutter/material.dart';

class TaskBottomSheet extends StatefulWidget {
  const TaskBottomSheet({Key? key}) : super(key: key);

  @override
  State<TaskBottomSheet> createState() => _TaskBottomSheetState();
}

class _TaskBottomSheetState extends State<TaskBottomSheet> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descController = TextEditingController();

  String priority = 'Medium';
  String status = 'In Progress';
  String assignee = 'Jana Doe';

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            /// Handle bar
            Center(
              child: Container(
                width: 50,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),

            const SizedBox(height: 16),
            const Text(
              'New Task',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),

            const SizedBox(height: 12),
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Title',
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 12),
            TextField(
              controller: _descController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: priority,
                    items: ['Low', 'Medium', 'High']
                        .map((p) => DropdownMenuItem(
                              value: p,
                              child: Text(p),
                            ))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => priority = val);
                    },
                    decoration: const InputDecoration(
                      labelText: 'Priority',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: status,
                    items: ['To Do', 'In Progress', 'Done']
                        .map((s) => DropdownMenuItem(
                              value: s,
                              child: Text(s),
                            ))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => status = val);
                    },
                    decoration: const InputDecoration(
                      labelText: 'Status',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: assignee,
              items: ['Jana Doe', 'John Smith', 'Alice Lee']
                  .map((a) => DropdownMenuItem(
                        value: a,
                        child: Text(a),
                      ))
                  .toList(),
              onChanged: (val) {
                if (val != null) setState(() => assignee = val);
              },
              decoration: const InputDecoration(
                labelText: 'Assignee',
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey,
                  ),
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                const SizedBox(width: 10),
                ElevatedButton(
                  onPressed: () {
                    final taskData = {
                      'title': _titleController.text,
                      'description': _descController.text,
                      'priority': priority,
                      'status': status,
                      'assignee': assignee,
                    };
                    Navigator.pop(context, taskData); // ✅ return task data
                  },
                  child: const Text('Add'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
