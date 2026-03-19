export function toLegacyMessagePayload(message, senderName) {
  const createdAt = message.created_at instanceof Date ? message.created_at.toISOString() : message.created_at;
  const editedAt = message.edited_at instanceof Date ? message.edited_at.toISOString() : message.edited_at;

  return {
    message_id: String(message.message_id),
    room_id: String(message.room_id),
    sender_id: String(message.sender_id),
    sender_username: senderName || null,
    content: message.content,
    message_type: message.message_type || 'text',
    reply_to_id: message.reply_to_id ? String(message.reply_to_id) : null,
    created_at: createdAt,
    edited_at: editedAt,
    is_deleted: message.is_deleted,
  };
}
