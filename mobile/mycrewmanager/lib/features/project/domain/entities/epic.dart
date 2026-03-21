import 'sub_epic.dart';

class Epic {
  final int id;
  final String title;
  final String description;
  final bool ai;
  final bool isComplete;
  final List<SubEpic> subEpics;

  Epic({
    required this.id,
    required this.title,
    required this.description,
    required this.ai,
    required this.isComplete,
    required this.subEpics,
  });

  factory Epic.fromJson(Map<String, dynamic> json) {
    return Epic(
      id: _asInt(json['id']),
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      ai: _asBool(json['ai']),
      isComplete: _asBool(json['is_complete']),
      subEpics: (json['sub_epics'] as List<dynamic>?)
          ?.map((subEpic) => SubEpic.fromJson(subEpic))
          .toList() ?? [],
    );
  }

  static int _asInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
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
      'description': description,
      'ai': ai,
      'is_complete': isComplete,
      'sub_epics': subEpics.map((subEpic) => subEpic.toJson()).toList(),
    };
  }
}
