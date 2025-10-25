import 'epic.dart';

class Backlog {
  final List<Epic> epics;

  Backlog({
    required this.epics,
  });

  factory Backlog.fromJson(Map<String, dynamic> json) {
    return Backlog(
      epics: (json['epics'] as List<dynamic>?)
          ?.map((epic) => Epic.fromJson(epic))
          .toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'epics': epics.map((epic) => epic.toJson()).toList(),
    };
  }
}
