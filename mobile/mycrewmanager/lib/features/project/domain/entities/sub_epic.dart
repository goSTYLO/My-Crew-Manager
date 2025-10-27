import 'user_story.dart';

class SubEpic {
  final int id;
  final String title;
  final bool ai;
  final bool isComplete;
  final List<UserStory> userStories;

  SubEpic({
    required this.id,
    required this.title,
    required this.ai,
    required this.isComplete,
    required this.userStories,
  });

  factory SubEpic.fromJson(Map<String, dynamic> json) {
    return SubEpic(
      id: json['id'] as int,
      title: json['title'] as String,
      ai: json['ai'] as bool,
      isComplete: json['is_complete'] as bool,
      userStories: (json['user_stories'] as List<dynamic>?)
          ?.map((story) => UserStory.fromJson(story))
          .toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'ai': ai,
      'is_complete': isComplete,
      'user_stories': userStories.map((story) => story.toJson()).toList(),
    };
  }
}
