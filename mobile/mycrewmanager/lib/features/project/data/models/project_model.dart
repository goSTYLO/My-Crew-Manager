import 'package:mycrewmanager/features/project/domain/entities/project.dart';

class ProjectModel extends Project {
  ProjectModel({
    required super.id,
    required super.title,
    required super.summary,
    required super.createdBy,
    required super.createdByName,
    required super.createdAt,
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    return ProjectModel(
      id: _asInt(json['id']),
      title: (json['title'] ?? '').toString(),
      summary: (json['summary'] ?? '').toString(),
      createdBy: _asInt(json['created_by']),
      createdByName: (json['created_by_name'] ?? 'Unknown User').toString(),
      createdAt: _asDateTime(json['created_at']),
    );
  }

  static int _asInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }

  static DateTime _asDateTime(dynamic value) {
    if (value is DateTime) return value;
    if (value == null) return DateTime.now();
    return DateTime.tryParse(value.toString()) ?? DateTime.now();
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'summary': summary,
      'created_by': createdBy,
      'created_by_name': createdByName,
      'created_at': createdAt.toIso8601String(),
    };
  }

  ProjectModel copyWith({
    int? id,
    String? title,
    String? summary,
    int? createdBy,
    String? createdByName,
    DateTime? createdAt,
  }) {
    return ProjectModel(
      id: id ?? this.id,
      title: title ?? this.title,
      summary: summary ?? this.summary,
      createdBy: createdBy ?? this.createdBy,
      createdByName: createdByName ?? this.createdByName,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

