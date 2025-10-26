import 'package:flutter/material.dart';


class AddTeamCard extends StatelessWidget {
  final String role;
  final String name;

  const AddTeamCard({super.key, required this.role, required this.name});
  
  @override
  Widget build(BuildContext context) {
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
                Text(role,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 14)),
                Text("Assign to: $name",
                    style: const TextStyle(fontSize: 13, color: Colors.grey)),
              ],
            ),
          ),
          const Icon(Icons.edit, color: Colors.grey, size: 18),
        ],
      ),
    );
  }
}