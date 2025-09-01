import 'package:flutter/material.dart';

class CalendarWidget extends StatelessWidget {
  const CalendarWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final days = [
      {'label': 'S', 'date': '10', 'selected': false},
      {'label': 'M', 'date': '11', 'selected': false},
      {'label': 'T', 'date': '12', 'selected': false},
      {'label': 'W', 'date': '13', 'selected': false},
      {'label': 'TH', 'date': '14', 'selected': true},
      {'label': 'F', 'date': '15', 'selected': false},
      {'label': 'S', 'date': '16', 'selected': false},
    ];

    return Container(
      height: 92,
      decoration: BoxDecoration(
        color: const Color(0xFFF7F7FA),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          // Left arrow
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Icon(Icons.chevron_left, color: Color(0xFF181929), size: 28),
          ),
          // Days
          Expanded(
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: days.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final day = days[index];
                final selected = day['selected'] as bool;
                if (selected) {
                  // Special styling for selected day
                  return Container(
                    width: 48,
                    height: 64,
                    decoration: BoxDecoration(
                      color: const Color(0xFF181929),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          day['label'] as String,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: const Color(0xFF2563EB),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              day['date'] as String,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 15,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                } else {
                  // Normal styling for unselected days
                  return Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        day['label'] as String,
                        style: const TextStyle(
                          color: Color(0xFF181929),
                          fontWeight: FontWeight.w500,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF7F7FA),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFFE8ECF4),
                            width: 2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            day['date'] as String,
                            style: const TextStyle(
                              color: Color(0xFF181929),
                              fontWeight: FontWeight.w500,
                              fontSize: 15,
                            ),
                          ),
                        ),
                      ),
                    ],
                  );
                }
              },
            ),
          ),
          // Right arrow
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Icon(Icons.chevron_right, color: Color(0xFF181929), size: 28),
          ),
        ],
      ),
    );
  }
    // Additional methods or properties can be added here if needed
}


