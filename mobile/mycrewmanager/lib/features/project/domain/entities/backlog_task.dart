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
      id: _asInt(json['id']),
      title: (json['title'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      ai: _asBool(json['ai']),
      assignee: _asNullableInt(json['assignee']),
      assigneeDetails: json['assignee_details'] != null 
          ? AssigneeDetails.fromJson(json['assignee_details']) 
          : null,
      commitTitle: json['commit_title']?.toString(),
      commitBranch: json['commit_branch']?.toString(),
    );
  }

  static int _asInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }

  static int? _asNullableInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString());
  }

  static bool _asBool(dynamic value) {
    if (value is bool) return value;
    if (value is num) return value != 0;
    if (value == null) return false;
    final lowered = value.toString().toLowerCase();
    return lowered == 'true' || lowered == '1' || lowered == 'yes';
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
      id: _asInt(json['id']),
      userName: json['user_name']?.toString(),
      userEmail: json['user_email']?.toString(),
    );
  }

  static int _asInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_name': userName,
      'user_email': userEmail,
    };
  }
}
