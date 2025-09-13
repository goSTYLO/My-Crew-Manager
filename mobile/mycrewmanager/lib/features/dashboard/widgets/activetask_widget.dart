import 'package:flutter/material.dart';

class ActiveTaskWidget extends StatelessWidget {
  final VoidCallback? onBack;
  final VoidCallback? onForward;
  final VoidCallback? onTaskTap;

  const ActiveTaskWidget({
    super.key,
    this.onBack,
    this.onForward,
    this.onTaskTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with title and buttons
          Row(
            children: [
              const Text(
                "Active Tasks",
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                  color: Color(0xFF181929),
                ),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_new,
                    size: 18, color: Color(0xFFB3B6C7)),
                onPressed: onBack,
                tooltip: "Previous",
                splashRadius: 20,
              ),
              IconButton(
                icon: const Icon(Icons.arrow_forward_ios,
                    size: 18, color: Color(0xFFB3B6C7)),
                onPressed: onForward,
                tooltip: "Next",
                splashRadius: 20,
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Task Card
          GestureDetector(
            onTap: onTaskTap,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: const Color(0xFFF7F8FA),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Image (remote demo image)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80",
                      height: 90,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  Row(
                      children: [
                        const Icon(Icons.trending_up, size: 20, color: Color.fromARGB(255, 255, 0, 0)),  
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            "Creating Mobile App Design",
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                              color: Color(0xFF181929),
                            ),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        ),
                      ],
                    ),

                  const SizedBox(height: 10),

                  // Deadline Row
                  Row(
                    children: const [
                      Icon(Icons.access_time,
                          color: Color(0xFF7B7F9E), size: 18),
                      SizedBox(width: 6),
                      Text(
                        "3 Days Left",
                        style: TextStyle(
                          color: Color(0xFF181929),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
