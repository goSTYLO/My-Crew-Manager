import 'package:mycrewmanager/features/project/domain/entities/member.dart';

class MemberModel extends Member {
  MemberModel({
    required super.id,
    required super.name,
    required super.role,
    required super.email,
    required super.avatar,
    required super.projectId,
  });

  factory MemberModel.fromJson(Map<String, dynamic> map) {
    return MemberModel(
      id: map['id'] ?? 0,
      name: map['user_name'] ?? '',
      role: map['role'] ?? '',
      email: map['user_email'] ?? '',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg', // Default avatar
      projectId: map['project'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'role': role,
      'email': email,
      'avatar': avatar,
      'project_id': projectId,
    };
  }
}
