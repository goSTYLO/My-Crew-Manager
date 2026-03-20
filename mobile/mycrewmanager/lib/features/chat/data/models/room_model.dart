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

  static int _asInt(dynamic value, {int fallback = 0}) {
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? fallback;
    if (value is num) return value.toInt();
    return fallback;
  }

  factory RoomModel.fromJson(Map<String, dynamic> json) => RoomModel(
        roomId: _asInt(json['room_id']),
        name: json['name'] as String?,
        isPrivate: json['is_private'] as bool? ?? false,
        createdById: _asInt(json['created_by_id']),
        createdAt: json['created_at'] as String,
        membersCount: _asInt(json['members_count']),
        unreadCount: _asInt(json['unread_count']),
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


