import 'package:flutter/material.dart';

class FilterBottomSheet extends StatefulWidget {
  const FilterBottomSheet({super.key});

  @override
  State<FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<FilterBottomSheet> {
  String selectedStatus = 'All';
  String selectedDueDate = 'Any';

  final List<String> statuses = const ['All', 'In Progress', 'Completed'];
  final List<String> dueDates = const ['Any', 'Today', 'This Week', 'This Month', 'Custom'];

  Widget _buildChipSection({
    required String title,
    required List<String> options,
    required String selectedValue,
    required void Function(String) onSelected,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: options.map((option) {
            final isSelected = selectedValue == option;
            return ChoiceChip(
              label: Text(option),
              selected: isSelected,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : null,
              ),
              onSelected: (_) => onSelected(option),
            );
          }).toList(),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(
        chipTheme: ChipThemeData(
          selectedColor: Colors.blue,
          backgroundColor: Colors.grey[200]!,
          labelStyle: const TextStyle(color: Colors.black),
          secondarySelectedColor: Colors.blue,
          brightness: Brightness.light,
          side: BorderSide(color: Colors.grey[400]!),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
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
            // Header row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Filter',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                ),
                TextButton(
                  onPressed: () {
                    setState(() {
                      selectedStatus = 'All';
                      selectedDueDate = 'Any';
                    });
                  },
                  child: const Text(
                    'Clear',
                    style: TextStyle(color: Colors.blue),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Status chips
            _buildChipSection(
              title: 'Status',
              options: statuses,
              selectedValue: selectedStatus,
              onSelected: (value) => setState(() => selectedStatus = value),
            ),
            const SizedBox(height: 20),
            // Due date chips
            _buildChipSection(
              title: 'Due Date',
              options: dueDates,
              selectedValue: selectedDueDate,
              onSelected: (value) => setState(() => selectedDueDate = value),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey[200],
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () {
                  Navigator.pop(context, {
                    'status': selectedStatus,
                    'dueDate': selectedDueDate,
                  });
                },
                child: const Text(
                  'Apply Filters',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}