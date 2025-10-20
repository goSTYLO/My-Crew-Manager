import 'package:flutter/material.dart';

enum BacklogType { epic, subEpic, story }

class BacklogItem {
  final String id;
  final BacklogType type;
  final String title;
  final List<BacklogItem> children;

  BacklogItem({
    required this.id,
    required this.type,
    required this.title,
    this.children = const [],
  });
}

class BacklogOverviewPage extends StatefulWidget {
  final String projectName;
  const BacklogOverviewPage({super.key, required this.projectName});

  static Route<Object?> route({required String projectName}) =>
      MaterialPageRoute(builder: (_) => BacklogOverviewPage(projectName: projectName));

  @override
  State<BacklogOverviewPage> createState() => _BacklogOverviewPageState();
}

class _BacklogOverviewPageState extends State<BacklogOverviewPage> {
  bool _editMode = false;
  List<BacklogItem> backlog = [
    BacklogItem(
      id: '1',
      type: BacklogType.epic,
      title: 'User Management',
      children: [
        BacklogItem(
          id: '2',
          type: BacklogType.subEpic,
          title: 'Authentication',
          children: [
            BacklogItem(id: '3', type: BacklogType.story, title: 'User Registration Flow'),
            BacklogItem(id: '4', type: BacklogType.story, title: 'Login with Email/Password'),
          ],
        ),
      ],
    ),
    BacklogItem(
      id: '5',
      type: BacklogType.epic,
      title: 'API Development',
      children: [
        BacklogItem(
          id: '6',
          type: BacklogType.subEpic,
          title: 'Authentication',
          children: [
            BacklogItem(id: '7', type: BacklogType.story, title: 'User Registration Flow'),
            BacklogItem(id: '8', type: BacklogType.story, title: 'Login with Email/Password'),
          ],
        ),
      ],
    ),
  ];

  void _showAddItemSheet({BacklogType? parentType, String? parentId}) {
    BacklogType? selectedType = parentType ?? BacklogType.epic;
    final TextEditingController titleController = TextEditingController();
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
              const Text("Add Backlog Item", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 16),
              DropdownButtonFormField<BacklogType>(
                initialValue: selectedType,
                items: const [
                  DropdownMenuItem(value: BacklogType.epic, child: Text('Epic')),
                  DropdownMenuItem(value: BacklogType.subEpic, child: Text('Sub-Epic')),
                  DropdownMenuItem(value: BacklogType.story, child: Text('Story')),
                ],
                onChanged: (val) {
                  selectedType = val;
                },
                decoration: InputDecoration(
                  labelText: "Type",
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: titleController,
                decoration: InputDecoration(
                  labelText: "Title",
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        if (titleController.text.isNotEmpty && selectedType != null) {
                          setState(() {
                            final newItem = BacklogItem(
                              id: DateTime.now().millisecondsSinceEpoch.toString(),
                              type: selectedType!,
                              title: titleController.text,
                            );
                            if (parentId == null) {
                              backlog.add(newItem);
                            } else {
                              _addItemToParent(backlog, parentId, newItem);
                            }
                          });
                          Navigator.pop(context);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text("Add Item", style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(width: 16),
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

  void _addItemToParent(List<BacklogItem> items, String parentId, BacklogItem newItem) {
    for (var item in items) {
      if (item.id == parentId) {
        item.children.add(newItem);
        return;
      } else {
        _addItemToParent(item.children, parentId, newItem);
      }
    }
  }

  void _deleteItem(String id) {
    setState(() {
      _deleteItemRecursive(backlog, id);
    });
  }

  bool _deleteItemRecursive(List<BacklogItem> items, String id) {
    for (int i = 0; i < items.length; i++) {
      if (items[i].id == id) {
        items.removeAt(i);
        return true;
      } else if (_deleteItemRecursive(items[i].children, id)) {
        return true;
      }
    }
    return false;
  }

  Color _getTypeColor(BacklogType type) {
    switch (type) {
      case BacklogType.epic:
        return Colors.purpleAccent;
      case BacklogType.subEpic:
        return Colors.pinkAccent;
      case BacklogType.story:
        return Colors.green;
    }
  }

  String _getTypeLabel(BacklogType type) {
    switch (type) {
      case BacklogType.epic:
        return 'EPIC';
      case BacklogType.subEpic:
        return 'SUB-EPIC';
      case BacklogType.story:
        return 'STORY';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Backlog Overview', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: Colors.black)),
            Text('Project: ${widget.projectName}', style: const TextStyle(fontSize: 15, color: Colors.black54)),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(_editMode ? Icons.check : Icons.edit, color: Colors.black54),
            onPressed: () {
              setState(() {
                _editMode = !_editMode;
              });
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                children: [
                  ...backlog.map((epic) => _buildBacklogCard(epic)),
                  const SizedBox(height: 12),
                  InkWell(
                    onTap: () => _showAddItemSheet(),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.add, color: Colors.black54),
                          SizedBox(width: 8),
                          Text('+ Add New Item', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: Colors.black54)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey[700],
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBacklogCard(BacklogItem item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                Icon(Icons.drag_indicator, color: Colors.black38),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getTypeColor(item.type),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(_getTypeLabel(item.type), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(item.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                ),
                if (_editMode) ...[
                  IconButton(
                    icon: const Icon(Icons.delete, color: Colors.black54),
                    onPressed: () => _deleteItem(item.id),
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit, color: Colors.black54),
                    onPressed: () => _showAddItemSheet(parentType: BacklogType.story, parentId: item.id),
                  ),
                ],
              ],
            ),
          ),
          if (item.children.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(left: 32),
              child: Column(
                children: item.children.map(_buildBacklogCard).toList(),
              ),
            ),
        ],
      ),
    );
  }
}
