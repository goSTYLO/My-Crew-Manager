class BacklogTask {
  final int id;
  final String title;
  final String status;
  final bool ai;
  final int? assignee;
  final AssigneeDetails? assigneeDetails;
  final String? commitTitle;
  final String? commitBranch;

  BacklogTask({
    required this.id,
    required this.title,
    required this.status,
    required this.ai,
    this.assignee,
    this.assigneeDetails,
    this.commitTitle,
    this.commitBranch,
  });

  factory BacklogTask.fromJson(Map<String, dynamic> json) {
    return BacklogTask(
      id: json['id'] as int,
      title: json['title'] as String,
      status: json['status'] as String,
      ai: json['ai'] as bool,
      assignee: json['assignee'] as int?,
      assigneeDetails: json['assignee_details'] != null 
          ? AssigneeDetails.fromJson(json['assignee_details']) 
          : null,
      commitTitle: json['commit_title'] as String?,
      commitBranch: json['commit_branch'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'status': status,
      'ai': ai,
      'assignee': assignee,
      'assignee_details': assigneeDetails?.toJson(),
      'commit_title': commitTitle,
      'commit_branch': commitBranch,
    };
  }
}

class AssigneeDetails {
  final int id;
  final String? userName;
  final String? userEmail;

  AssigneeDetails({
    required this.id,
    this.userName,
    this.userEmail,
  });

  factory AssigneeDetails.fromJson(Map<String, dynamic> json) {
    return AssigneeDetails(
      id: json['id'] as int,
      userName: json['user_name'] as String?,
      userEmail: json['user_email'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_name': userName,
      'user_email': userEmail,
    };
  }
}
