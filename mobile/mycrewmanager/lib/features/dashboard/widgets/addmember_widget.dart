import 'package:flutter/material.dart';

class AddMemberBottomSheet extends StatefulWidget {
  const AddMemberBottomSheet({Key? key}) : super(key: key);

  @override
  State<AddMemberBottomSheet> createState() => _AddMemberBottomSheetState();
}

class _AddMemberBottomSheetState extends State<AddMemberBottomSheet> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  String? selectedRole;

  final List<String> roles = [
    "Frontend Developer",
    "Backend Developer", 
    "Designer",
    "Project Manager",
    "QA Tester",
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: MediaQuery.of(context).viewInsets, // ensures keyboard push-up
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 50,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey[400],
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              "Add Team Member",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // Name Input
            TextField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: "Full Name",
                prefixIcon: const Icon(Icons.person_outlined),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                hintText: "John Doe",
              ),
            ),
            const SizedBox(height: 16),

            // Email Input
            TextField(
              controller: _emailController,
              decoration: InputDecoration(
                labelText: "Email Address",
                prefixIcon: const Icon(Icons.email_outlined),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                hintText: "name@company.com",
              ),
            ),
            const SizedBox(height: 16),

            // Role Dropdown
            DropdownButtonFormField<String>(
              initialValue: selectedRole,
              items: roles.map((role) {
                return DropdownMenuItem(
                  value: role,
                  child: Text(role),
                );
              }).toList(),
              onChanged: (value) {
                setState(() => selectedRole = value);
              },
              decoration: InputDecoration(
                labelText: "Role",
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                hintText: "e.g., Frontend Developer",
              ),
            ),
            const SizedBox(height: 20),

            // Add Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  if (_nameController.text.isNotEmpty && 
                      _emailController.text.isNotEmpty && 
                      selectedRole != null) {
                    Navigator.pop(context, {
                      "name": _nameController.text,
                      "email": _emailController.text,
                      "role": selectedRole,
                    });
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text("Add Member"),
              ),
            ),
            const SizedBox(height: 10),

            // Cancel Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text("Cancel", style: TextStyle(color: Colors.black)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
