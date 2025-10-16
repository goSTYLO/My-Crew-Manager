class ProjectTask {
  final int id;
  final String title;
  final String status;
  final int userStoryId;
  final bool isAi;
  final int? assigneeId;
  final String? assigneeName;

  ProjectTask({
    required this.id,
    required this.title,
    required this.status,
    required this.userStoryId,
    required this.isAi,
    this.assigneeId,
    this.assigneeName,
  });
}

