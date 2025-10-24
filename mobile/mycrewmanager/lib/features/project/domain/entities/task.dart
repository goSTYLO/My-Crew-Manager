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

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'status': status,
      'userStoryId': userStoryId,
      'isAi': isAi,
      'assigneeId': assigneeId,
      'assigneeName': assigneeName,
    };
  }

  factory ProjectTask.fromJson(Map<String, dynamic> json) {
    return ProjectTask(
      id: json['id'] as int,
      title: json['title'] as String,
      status: json['status'] as String,
      userStoryId: json['userStoryId'] as int,
      isAi: json['isAi'] as bool,
      assigneeId: json['assigneeId'] as int?,
      assigneeName: json['assigneeName'] as String?,
    );
  }
}

