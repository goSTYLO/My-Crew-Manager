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
      id: json['id'] as int,
      title: json['title'] as String,
      description: json['description'] as String,
      ai: json['ai'] as bool,
      isComplete: json['is_complete'] as bool,
      subEpics: (json['sub_epics'] as List<dynamic>?)
          ?.map((subEpic) => SubEpic.fromJson(subEpic))
          .toList() ?? [],
    );
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
