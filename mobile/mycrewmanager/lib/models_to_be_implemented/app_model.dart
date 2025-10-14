class User {
  final int userID;
  final String name;
  final String email;
  final String passwordHash;
  final String? profileImage;

  User({
    required this.userID,
    required this.name,
    required this.email,
    required this.passwordHash,
    this.profileImage,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        userID: json['userID'],
        name: json['name'],
        email: json['email'],
        passwordHash: json['passwordHash'],
        profileImage: json['profileImage'],
      );

  Map<String, dynamic> toJson() => {
        'userID': userID,
        'name': name,
        'email': email,
        'passwordHash': passwordHash,
        'profileImage': profileImage,
      };
}

class Proposal {
  final int proposalID;
  final String filePath;
  final String parsedText;
  final DateTime uploadedDate;
  final int uploadedBy; // FK → User

  Proposal({
    required this.proposalID,
    required this.filePath,
    required this.parsedText,
    required this.uploadedDate,
    required this.uploadedBy,
  });

  factory Proposal.fromJson(Map<String, dynamic> json) => Proposal(
        proposalID: json['proposalID'],
        filePath: json['filePath'],
        parsedText: json['parsedText'],
        uploadedDate: DateTime.parse(json['uploadedDate']),
        uploadedBy: json['uploadedBy'],
      );

  Map<String, dynamic> toJson() => {
        'proposalID': proposalID,
        'filePath': filePath,
        'parsedText': parsedText,
        'uploadedDate': uploadedDate.toIso8601String(),
        'uploadedBy': uploadedBy,
      };
}

class Project {
  final int projectID;
  final String title;
  final String summary;
  final String timeline;
  final String risks;
  final int proposalID; // FK → Proposal
  final int createdBy; // FK → User

  Project({
    required this.projectID,
    required this.title,
    required this.summary,
    required this.timeline,
    required this.risks,
    required this.proposalID,
    required this.createdBy,
  });

  factory Project.fromJson(Map<String, dynamic> json) => Project(
        projectID: json['projectID'],
        title: json['title'],
        summary: json['summary'],
        timeline: json['timeline'],
        risks: json['risks'],
        proposalID: json['proposalID'],
        createdBy: json['createdBy'],
      );

  Map<String, dynamic> toJson() => {
        'projectID': projectID,
        'title': title,
        'summary': summary,
        'timeline': timeline,
        'risks': risks,
        'proposalID': proposalID,
        'createdBy': createdBy,
      };
}

class Member {
  final int memberID;
  final String role;
  final int projectID; // FK → Project

  Member({
    required this.memberID,
    required this.role,
    required this.projectID,
  });

  factory Member.fromJson(Map<String, dynamic> json) => Member(
        memberID: json['memberID'],
        role: json['role'],
        projectID: json['projectID'],
      );

  Map<String, dynamic> toJson() => {
        'memberID': memberID,
        'role': role,
        'projectID': projectID,
      };
}

class Backlog {
  final int backlogID;
  final int projectID; // FK → Project
  final DateTime createdDate;
  final DateTime lastUpdated;

  Backlog({
    required this.backlogID,
    required this.projectID,
    required this.createdDate,
    required this.lastUpdated,
  });

  factory Backlog.fromJson(Map<String, dynamic> json) => Backlog(
        backlogID: json['backlogID'],
        projectID: json['projectID'],
        createdDate: DateTime.parse(json['createdDate']),
        lastUpdated: DateTime.parse(json['lastUpdated']),
      );

  Map<String, dynamic> toJson() => {
        'backlogID': backlogID,
        'projectID': projectID,
        'createdDate': createdDate.toIso8601String(),
        'lastUpdated': lastUpdated.toIso8601String(),
      };
}

class Epic {
  final int epicID;
  final int backlogID; // FK → Backlog
  final String title;
  final String description;

  Epic({
    required this.epicID,
    required this.backlogID,
    required this.title,
    required this.description,
  });

  factory Epic.fromJson(Map<String, dynamic> json) => Epic(
        epicID: json['epicID'],
        backlogID: json['backlogID'],
        title: json['title'],
        description: json['description'],
      );

  Map<String, dynamic> toJson() => {
        'epicID': epicID,
        'backlogID': backlogID,
        'title': title,
        'description': description,
      };
}

class SubEpic {
  final int subEpicID;
  final int epicID; // FK → Epic
  final String title;
  final String description;

  SubEpic({
    required this.subEpicID,
    required this.epicID,
    required this.title,
    required this.description,
  });

  factory SubEpic.fromJson(Map<String, dynamic> json) => SubEpic(
        subEpicID: json['subEpicID'],
        epicID: json['epicID'],
        title: json['title'],
        description: json['description'],
      );

  Map<String, dynamic> toJson() => {
        'subEpicID': subEpicID,
        'epicID': epicID,
        'title': title,
        'description': description,
      };
}

class UserStory {
  final int userStoryID;
  final int subEpicID; // FK → SubEpic
  final String title;
  final String description;
  final String acceptanceCriteria;

  UserStory({
    required this.userStoryID,
    required this.subEpicID,
    required this.title,
    required this.description,
    required this.acceptanceCriteria,
  });

  factory UserStory.fromJson(Map<String, dynamic> json) => UserStory(
        userStoryID: json['userStoryID'],
        subEpicID: json['subEpicID'],
        title: json['title'],
        description: json['description'],
        acceptanceCriteria: json['acceptanceCriteria'],
      );

  Map<String, dynamic> toJson() => {
        'userStoryID': userStoryID,
        'subEpicID': subEpicID,
        'title': title,
        'description': description,
        'acceptanceCriteria': acceptanceCriteria,
      };
}

class Task {
  final int taskID;
  final int projectID; // FK → Project
  final String title;
  final String description;
  final String status;
  final String role;

  Task({
    required this.taskID,
    required this.projectID,
    required this.title,
    required this.description,
    required this.status,
    required this.role,
  });

  factory Task.fromJson(Map<String, dynamic> json) => Task(
        taskID: json['taskID'],
        projectID: json['projectID'],
        title: json['title'],
        description: json['description'],
        status: json['status'],
        role: json['role'],
      );

  Map<String, dynamic> toJson() => {
        'taskID': taskID,
        'projectID': projectID,
        'title': title,
        'description': description,
        'status': status,
        'role': role,
      };
}

class UserTask {
  final int userTaskID;
  final int userStoryID; // FK → UserStory
  final int taskID; // FK → Task

  UserTask({
    required this.userTaskID,
    required this.userStoryID,
    required this.taskID,
  });

  factory UserTask.fromJson(Map<String, dynamic> json) => UserTask(
        userTaskID: json['userTaskID'],
        userStoryID: json['userStoryID'],
        taskID: json['taskID'],
      );

  Map<String, dynamic> toJson() => {
        'userTaskID': userTaskID,
        'userStoryID': userStoryID,
        'taskID': taskID,
      };
}

class Sprint {
  final int sprintID;
  final int projectID; // FK → Project
  final int duration;
  final DateTime startDate;
  final DateTime endDate;

  Sprint({
    required this.sprintID,
    required this.projectID,
    required this.duration,
    required this.startDate,
    required this.endDate,
  });

  factory Sprint.fromJson(Map<String, dynamic> json) => Sprint(
        sprintID: json['sprintID'],
        projectID: json['projectID'],
        duration: json['duration'],
        startDate: DateTime.parse(json['startDate']),
        endDate: DateTime.parse(json['endDate']),
      );

  Map<String, dynamic> toJson() => {
        'sprintID': sprintID,
        'projectID': projectID,
        'duration': duration,
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
      };
}

class VoiceLog {
  final int voiceLogID;
  final int developerID; // FK → User
  final String audioPath;
  final String transcript;
  final DateTime createdDate;

  VoiceLog({
    required this.voiceLogID,
    required this.developerID,
    required this.audioPath,
    required this.transcript,
    required this.createdDate,
  });

  factory VoiceLog.fromJson(Map<String, dynamic> json) => VoiceLog(
        voiceLogID: json['voiceLogID'],
        developerID: json['developerID'],
        audioPath: json['audioPath'],
        transcript: json['transcript'],
        createdDate: DateTime.parse(json['createdDate']),
      );

  Map<String, dynamic> toJson() => {
        'voiceLogID': voiceLogID,
        'developerID': developerID,
        'audioPath': audioPath,
        'transcript': transcript,
        'createdDate': createdDate.toIso8601String(),
      };
}

class Gamification {
  final int gamificationID;
  final int developerID; // FK → User
  final String badgeName;
  final int points;
  final DateTime earnedDate;

  Gamification({
    required this.gamificationID,
    required this.developerID,
    required this.badgeName,
    required this.points,
    required this.earnedDate,
  });

  factory Gamification.fromJson(Map<String, dynamic> json) => Gamification(
        gamificationID: json['gamificationID'],
        developerID: json['developerID'],
        badgeName: json['badgeName'],
        points: json['points'],
        earnedDate: DateTime.parse(json['earnedDate']),
      );

  Map<String, dynamic> toJson() => {
        'gamificationID': gamificationID,
        'developerID': developerID,
        'badgeName': badgeName,
        'points': points,
        'earnedDate': earnedDate.toIso8601String(),
      };
}

class Report {
  final int reportID;
  final int projectID; // FK → Project
  final String reportType;
  final String filePath;

  Report({
    required this.reportID,
    required this.projectID,
    required this.reportType,
    required this.filePath,
  });

  factory Report.fromJson(Map<String, dynamic> json) => Report(
        reportID: json['reportID'],
        projectID: json['projectID'],
        reportType: json['reportType'],
        filePath: json['filePath'],
      );

  Map<String, dynamic> toJson() => {
        'reportID': reportID,
        'projectID': projectID,
        'reportType': reportType,
        'filePath': filePath,
      };
}
