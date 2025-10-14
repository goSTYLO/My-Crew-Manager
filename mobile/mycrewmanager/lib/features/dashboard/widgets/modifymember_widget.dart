import 'package:flutter/material.dart';

class ModifyMemberBottomSheet extends StatefulWidget {
  final String name;
  final String role;
  final String avatarUrl;

  const ModifyMemberBottomSheet({
    super.key,
    required this.name,
    required this.role,
    required this.avatarUrl,
  });

  @override
  State<ModifyMemberBottomSheet> createState() => _ModifyMemberBottomSheetState();
}

class _ModifyMemberBottomSheetState extends State<ModifyMemberBottomSheet> {
  String? _selectedRole;

  final List<String> roles = [
    "Front-end Developer",
    "Back-end Developer",
    "Designer",
    "AI Engineer",
    "Project Lead",
  ];

  @override
  void initState() {
    super.initState();
    _selectedRole = widget.role;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
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

          // Title
          const Text(
            "Modify Role / Remove",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // Member info
          Row(
            children: [
              CircleAvatar(
                radius: 26,
                backgroundImage: NetworkImage(widget.avatarUrl),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.name,
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w600)),
                  Text(widget.role,
                      style: const TextStyle(color: Colors.grey, fontSize: 14)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Dropdown for role
          DropdownButtonFormField<String>(
            value: _selectedRole,
            items: roles
                .map((role) =>
                    DropdownMenuItem(value: role, child: Text(role)))
                .toList(),
            onChanged: (val) {
              setState(() => _selectedRole = val);
            },
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
          ),
          const SizedBox(height: 20),

          // Remove button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Removed member (placeholder)")),
                );
              },
              child: const Text("Remove"),
            ),
          ),
          const SizedBox(height: 8),

          // Cancel button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => Navigator.pop(context),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text("Cancel"),
            ),
          ),
        ],
      ),
    );
  }
}
