import 'package:flutter/material.dart';

class ModifyProjectBottomSheet extends StatelessWidget {
  final VoidCallback? onEdit;
  final VoidCallback? onShare;
  final VoidCallback? onArchive;
  final VoidCallback? onDelete;

  const ModifyProjectBottomSheet({
    super.key,
    this.onEdit,
    this.onShare,
    this.onArchive,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
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
          ListTile(
            leading: const Icon(Icons.edit, color: Colors.black87),
            title: const Text('Edit Project', style: TextStyle(fontWeight: FontWeight.w500)),
            onTap: onEdit,
          ),
          ListTile(
            leading: const Icon(Icons.share, color: Colors.black87),
            title: const Text('Share Project', style: TextStyle(fontWeight: FontWeight.w500)),
            onTap: onShare,
          ),
          ListTile(
            leading: const Icon(Icons.archive, color: Colors.black87),
            title: const Text('Archive Project', style: TextStyle(fontWeight: FontWeight.w500)),
            onTap: onArchive,
          ),
          const Divider(height: 32),
          ListTile(
            leading: const Icon(Icons.delete, color: Colors.red),
            title: const Text('Delete Project', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w500)),
            onTap: onDelete,
          ),
        ],
      ),
    );
  }
}