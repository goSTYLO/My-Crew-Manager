class RoomModel {
  final int roomId;
  final String? name;
  final bool isPrivate;
  final int createdById;
  final String createdAt;
  final int membersCount;
  final int unreadCount;

  RoomModel({
    required this.roomId,
    required this.name,
    required this.isPrivate,
    required this.createdById,
    required this.createdAt,
    required this.membersCount,
    this.unreadCount = 0,
  });

  factory RoomModel.fromJson(Map<String, dynamic> json) => RoomModel(
        roomId: json['room_id'] as int,
        name: json['name'] as String?,
        isPrivate: json['is_private'] as bool? ?? false,
        createdById: json['created_by_id'] as int,
        createdAt: json['created_at'] as String,
        membersCount: json['members_count'] as int? ?? 0,
        unreadCount: json['unread_count'] as int? ?? 0,
      );

  RoomModel copyWith({
    int? roomId,
    String? name,
    bool? isPrivate,
    int? createdById,
    String? createdAt,
    int? membersCount,
    int? unreadCount,
  }) {
    return RoomModel(
      roomId: roomId ?? this.roomId,
      name: name ?? this.name,
      isPrivate: isPrivate ?? this.isPrivate,
      createdById: createdById ?? this.createdById,
      createdAt: createdAt ?? this.createdAt,
      membersCount: membersCount ?? this.membersCount,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }
}


