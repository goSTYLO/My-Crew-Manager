import 'package:flutter/material.dart';

class SkeletonLoader extends StatefulWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;

  const SkeletonLoader({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius,
  });

  @override
  State<SkeletonLoader> createState() => _SkeletonLoaderState();
}

class _SkeletonLoaderState extends State<SkeletonLoader>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _animation = Tween<double>(
      begin: -1.0,
      end: 2.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    _animationController.repeat();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [
                const Color(0xFFE8ECF4),
                const Color(0xFFF7F8FA),
                const Color(0xFFE8ECF4),
              ],
              stops: [
                _animation.value - 0.3,
                _animation.value,
                _animation.value + 0.3,
              ].map((stop) => stop.clamp(0.0, 1.0)).toList(),
            ),
          ),
        );
      },
    );
  }
}

// Skeleton for task stats card
class TaskStatsSkeleton extends StatelessWidget {
  const TaskStatsSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF181929),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          // Left: Running Task skeleton
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SkeletonLoader(
                width: 80,
                height: 13,
              ),
              const SizedBox(height: 12),
              const SkeletonLoader(
                width: 40,
                height: 28,
              ),
            ],
          ),
          const Spacer(),
          // Center: Circular progress skeleton
          const SkeletonLoader(
            width: 56,
            height: 56,
            borderRadius: BorderRadius.all(Radius.circular(28)),
          ),
          const Spacer(),
          // Right: Total Task skeleton
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const SizedBox(height: 4),
              const SkeletonLoader(
                width: 30,
                height: 20,
              ),
              const SizedBox(height: 2),
              const SkeletonLoader(
                width: 25,
                height: 13,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Skeleton for task carousel card
class TaskCarouselSkeleton extends StatelessWidget {
  const TaskCarouselSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: const Color(0xFFF7F8FA),
        border: Border.all(
          color: const Color(0xFF6C63FF).withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Task icon and status skeleton
            Row(
              children: [
                const SkeletonLoader(
                  width: 28,
                  height: 28,
                  borderRadius: BorderRadius.all(Radius.circular(6)),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SkeletonLoader(
                        width: 60,
                        height: 9,
                      ),
                      const SizedBox(height: 1),
                      const SkeletonLoader(
                        width: 50,
                        height: 10,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Task title skeleton
            const Expanded(
              child: SkeletonLoader(
                width: double.infinity,
                height: 42,
              ),
            ),
            const SizedBox(height: 8),

            // Task details skeleton
            Row(
              children: [
                const SkeletonLoader(
                  width: 14,
                  height: 14,
                  borderRadius: BorderRadius.all(Radius.circular(7)),
                ),
                const SizedBox(width: 4),
                const Expanded(
                  child: SkeletonLoader(
                    width: double.infinity,
                    height: 10,
                  ),
                ),
                const SizedBox(width: 8),
                const SkeletonLoader(
                  width: 14,
                  height: 14,
                  borderRadius: BorderRadius.all(Radius.circular(7)),
                ),
                const SizedBox(width: 4),
                const SkeletonLoader(
                  width: 20,
                  height: 10,
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Tap to view hint skeleton
            const SkeletonLoader(
              width: double.infinity,
              height: 24,
              borderRadius: BorderRadius.all(Radius.circular(6)),
            ),
          ],
        ),
      ),
    );
  }
}

// Skeleton for incoming task row
class IncomingTaskRowSkeleton extends StatelessWidget {
  const IncomingTaskRowSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Avatar skeleton
        const SkeletonLoader(
          width: 44,
          height: 44,
          borderRadius: BorderRadius.all(Radius.circular(22)),
        ),
        const SizedBox(width: 12),
        // Content skeleton
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SkeletonLoader(
                width: double.infinity,
                height: 15,
              ),
              const SizedBox(height: 2),
              const SkeletonLoader(
                width: 80,
                height: 13,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// Skeleton for carousel container
class TaskCarouselContainerSkeleton extends StatelessWidget {
  const TaskCarouselContainerSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 220,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: const Color(0xFFF7F8FA),
      ),
      child: const Center(
        child: TaskCarouselSkeleton(),
      ),
    );
  }
}

// Skeleton for chat list items
class ChatListSkeleton extends StatelessWidget {
  const ChatListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          children: [
            // Avatar skeleton
            const SkeletonLoader(
              width: 48,
              height: 48,
              borderRadius: BorderRadius.all(Radius.circular(24)),
            ),
            const SizedBox(width: 12),
            // Content skeleton
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SkeletonLoader(
                    width: double.infinity,
                    height: 16,
                  ),
                  const SizedBox(height: 4),
                  const SkeletonLoader(
                    width: 120,
                    height: 14,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Skeleton for project cards
class ProjectCardSkeleton extends StatelessWidget {
  const ProjectCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF6C63FF).withOpacity(0.08),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: const Color(0xFF6C63FF).withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Icon skeleton
                const SkeletonLoader(
                  width: 48,
                  height: 48,
                  borderRadius: BorderRadius.all(Radius.circular(12)),
                ),
                const SizedBox(width: 16),
                // Content skeleton
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SkeletonLoader(
                        width: 120,
                        height: 18,
                      ),
                      const SizedBox(height: 8),
                      const SkeletonLoader(
                        width: double.infinity,
                        height: 14,
                      ),
                      const SizedBox(height: 4),
                      const SkeletonLoader(
                        width: 200,
                        height: 14,
                      ),
                    ],
                  ),
                ),
                // More button skeleton
                const SkeletonLoader(
                  width: 24,
                  height: 24,
                  borderRadius: BorderRadius.all(Radius.circular(12)),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Spacer(),
                const SkeletonLoader(
                  width: 16,
                  height: 16,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// Skeleton for task list items
class TaskListSkeleton extends StatelessWidget {
  const TaskListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Task icon skeleton
                const SkeletonLoader(
                  width: 24,
                  height: 24,
                  borderRadius: BorderRadius.all(Radius.circular(6)),
                ),
                const SizedBox(width: 12),
                // Task title skeleton
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SkeletonLoader(
                        width: double.infinity,
                        height: 16,
                      ),
                      const SizedBox(height: 4),
                      const SkeletonLoader(
                        width: 150,
                        height: 12,
                      ),
                    ],
                  ),
                ),
                // Status skeleton
                const SkeletonLoader(
                  width: 60,
                  height: 20,
                  borderRadius: BorderRadius.all(Radius.circular(10)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const SkeletonLoader(
                  width: 80,
                  height: 12,
                ),
                const Spacer(),
                const SkeletonLoader(
                  width: 100,
                  height: 12,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// Skeleton for notification items
class NotificationItemSkeleton extends StatelessWidget {
  const NotificationItemSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Notification icon skeleton
            const SkeletonLoader(
              width: 40,
              height: 40,
              borderRadius: BorderRadius.all(Radius.circular(20)),
            ),
            const SizedBox(width: 12),
            // Content skeleton
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SkeletonLoader(
                    width: double.infinity,
                    height: 16,
                  ),
                  const SizedBox(height: 4),
                  const SkeletonLoader(
                    width: 200,
                    height: 14,
                  ),
                  const SizedBox(height: 4),
                  const SkeletonLoader(
                    width: 80,
                    height: 12,
                  ),
                ],
              ),
            ),
            // Time skeleton
            const SkeletonLoader(
              width: 50,
              height: 12,
            ),
          ],
        ),
      ),
    );
  }
}

// Skeleton for member cards
class MemberCardSkeleton extends StatelessWidget {
  const MemberCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Avatar skeleton
            const SkeletonLoader(
              width: 48,
              height: 48,
              borderRadius: BorderRadius.all(Radius.circular(24)),
            ),
            const SizedBox(width: 12),
            // Content skeleton
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SkeletonLoader(
                    width: 120,
                    height: 16,
                  ),
                  const SizedBox(height: 4),
                  const SkeletonLoader(
                    width: 100,
                    height: 14,
                  ),
                ],
              ),
            ),
            // Role skeleton
            const SkeletonLoader(
              width: 80,
              height: 24,
              borderRadius: BorderRadius.all(Radius.circular(12)),
            ),
          ],
        ),
      ),
    );
  }
}

// Skeleton for chat messages
class ChatMessageSkeleton extends StatelessWidget {
  const ChatMessageSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          // Avatar skeleton
          const SkeletonLoader(
            width: 36,
            height: 36,
            borderRadius: BorderRadius.all(Radius.circular(18)),
          ),
          const SizedBox(width: 8),
          // Message content skeleton
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SkeletonLoader(
                  width: 80,
                  height: 12,
                ),
                const SizedBox(height: 4),
                const SkeletonLoader(
                  width: double.infinity,
                  height: 40,
                  borderRadius: BorderRadius.all(Radius.circular(14)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Skeleton for task overview page
class TaskOverviewSkeleton extends StatelessWidget {
  const TaskOverviewSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 0),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(18.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Task image skeleton
                  const SkeletonLoader(
                    width: double.infinity,
                    height: 140,
                    borderRadius: BorderRadius.all(Radius.circular(12)),
                  ),
                  const SizedBox(height: 18),
                  // Task title skeleton
                  const SkeletonLoader(
                    width: double.infinity,
                    height: 24,
                  ),
                  const SizedBox(height: 8),
                  // Task description skeleton
                  const SkeletonLoader(
                    width: double.infinity,
                    height: 16,
                  ),
                  const SizedBox(height: 4),
                  const SkeletonLoader(
                    width: 200,
                    height: 16,
                  ),
                  const SizedBox(height: 18),
                  // Due date skeleton
                  Row(
                    children: [
                      const Spacer(),
                      const SkeletonLoader(
                        width: 100,
                        height: 16,
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  // Details section skeleton
                  const SkeletonLoader(
                    width: 80,
                    height: 20,
                  ),
                  const SizedBox(height: 10),
                  // Status skeleton
                  Row(
                    children: [
                      const SkeletonLoader(
                        width: 50,
                        height: 16,
                      ),
                      const SizedBox(width: 8),
                      const SkeletonLoader(
                        width: 80,
                        height: 24,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Priority skeleton
                  Row(
                    children: [
                      const SkeletonLoader(
                        width: 60,
                        height: 16,
                      ),
                      const SizedBox(width: 8),
                      const SkeletonLoader(
                        width: 120,
                        height: 16,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Type skeleton
                  Row(
                    children: [
                      const SkeletonLoader(
                        width: 40,
                        height: 16,
                      ),
                      const SizedBox(width: 8),
                      const SkeletonLoader(
                        width: 60,
                        height: 16,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Resolution skeleton
                  Row(
                    children: [
                      const SkeletonLoader(
                        width: 80,
                        height: 16,
                      ),
                      const SizedBox(width: 8),
                      const SkeletonLoader(
                        width: 100,
                        height: 16,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Assignee skeleton
                  Row(
                    children: [
                      const SkeletonLoader(
                        width: 70,
                        height: 16,
                      ),
                      const SizedBox(width: 8),
                      const SkeletonLoader(
                        width: 32,
                        height: 32,
                        borderRadius: BorderRadius.all(Radius.circular(16)),
                      ),
                      const SizedBox(width: 6),
                      const SkeletonLoader(
                        width: 120,
                        height: 16,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Action button skeleton
                  const SkeletonLoader(
                    width: double.infinity,
                    height: 48,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
