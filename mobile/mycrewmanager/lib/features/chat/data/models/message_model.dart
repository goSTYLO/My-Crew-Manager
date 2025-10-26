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
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) => MessageModel(
        messageId: json['message_id'] as int,
        roomId: json['room_id'] as int,
        senderId: json['sender_id'] as int,
        senderUsername: json['sender_username'] as String? ?? '',
        content: json['content'] as String? ?? '',
        messageType: json['message_type'] as String? ?? 'text',
        replyToId: json['reply_to_id'] as int?,
        createdAt: json['created_at'] as String,
        editedAt: json['edited_at'] as String?,
        isDeleted: json['is_deleted'] as bool? ?? false,
      );
}


