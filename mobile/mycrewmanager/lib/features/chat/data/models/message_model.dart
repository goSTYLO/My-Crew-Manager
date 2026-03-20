class MessageModel {
  final int messageId;
  final int roomId;
  final int senderId;
  final String senderUsername;
  final String content;
  final String messageType;
  final int? replyToId;
  final String createdAt;
  final String? editedAt;
  final bool isDeleted;
  final String? tempId; // NEW: Temporary ID for optimistic updates
  final bool isPending; // NEW: Whether this message is pending confirmation

  MessageModel({
    required this.messageId,
    required this.roomId,
    required this.senderId,
    required this.senderUsername,
    required this.content,
    required this.messageType,
    required this.replyToId,
    required this.createdAt,
    required this.editedAt,
    required this.isDeleted,
    this.tempId,
    this.isPending = false,
  });

  static int _asInt(dynamic value, {int fallback = 0}) {
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? fallback;
    if (value is num) return value.toInt();
    return fallback;
  }

  factory MessageModel.fromJson(Map<String, dynamic> json) => MessageModel(
        messageId: _asInt(json['message_id']),
        roomId: _asInt(json['room_id']),
        senderId: _asInt(json['sender_id']),
        senderUsername: json['sender_username'] as String? ?? '',
        content: json['content'] as String? ?? '',
        messageType: json['message_type'] as String? ?? 'text',
        replyToId: json['reply_to_id'] == null ? null : _asInt(json['reply_to_id']),
        createdAt: json['created_at'] as String,
        editedAt: json['edited_at'] as String?,
        isDeleted: json['is_deleted'] as bool? ?? false,
        tempId: json['temp_id'] as String?,
        isPending: json['is_pending'] as bool? ?? false,
      );

  // NEW: Factory for creating optimistic messages
  factory MessageModel.optimistic({
    required String tempId,
    required int roomId,
    required int senderId,
    required String senderUsername,
    required String content,
    String messageType = 'text',
    int? replyToId,
  }) => MessageModel(
    messageId: -1, // Placeholder
    roomId: roomId,
    senderId: senderId,
    senderUsername: senderUsername,
    content: content,
    messageType: messageType,
    replyToId: replyToId,
    createdAt: DateTime.now().toIso8601String(),
    editedAt: null,
    isDeleted: false,
    tempId: tempId,
    isPending: true,
  );
  
  // NEW: Copy method for updating message
  MessageModel copyWith({
    int? messageId,
    int? roomId,
    int? senderId,
    String? senderUsername,
    String? content,
    String? messageType,
    int? replyToId,
    String? createdAt,
    String? editedAt,
    bool? isDeleted,
    String? tempId,
    bool? isPending,
  }) {
    return MessageModel(
      messageId: messageId ?? this.messageId,
      roomId: roomId ?? this.roomId,
      senderId: senderId ?? this.senderId,
      senderUsername: senderUsername ?? this.senderUsername,
      content: content ?? this.content,
      messageType: messageType ?? this.messageType,
      replyToId: replyToId ?? this.replyToId,
      createdAt: createdAt ?? this.createdAt,
      editedAt: editedAt ?? this.editedAt,
      isDeleted: isDeleted ?? this.isDeleted,
      tempId: tempId ?? this.tempId,
      isPending: isPending ?? this.isPending,
    );
  }
}


