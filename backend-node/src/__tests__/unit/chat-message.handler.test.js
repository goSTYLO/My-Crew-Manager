import { handleRoomRealtimeMessage } from '@/realtime/handlers/chat-message.handler.js';

describe('chat-message handler', () => {
  function buildSocket() {
    return {
      user: { user_id: 21, name: 'Socket User' },
      userId: '21',
    };
  }

  test('persists and broadcasts chat_message then sends ack', async () => {
    const ws = buildSocket();

    const prismaClient = {
      chat_message: {
        create: jest.fn().mockResolvedValue({
          message_id: 501,
          room_id: 99,
          sender_id: 21n,
          content: 'hello',
          message_type: 'text',
          reply_to_id: null,
          created_at: new Date('2026-03-20T10:00:00.000Z'),
          edited_at: null,
          is_deleted: false,
        }),
      },
    };

    const broadcaster = jest.fn();
    const ackSender = jest.fn();

    await handleRoomRealtimeMessage(
      ws,
      99,
      {
        type: 'chat_message',
        room_id: '99',
        content: 'hello',
        client_message_id: 'c-1',
      },
      { prismaClient, broadcaster, ackSender }
    );

    expect(prismaClient.chat_message.create).toHaveBeenCalled();
    expect(broadcaster).toHaveBeenCalledWith(
      'chat_99',
      expect.objectContaining({
        type: 'chat_message',
        client_message_id: 'c-1',
      })
    );
    expect(ackSender).toHaveBeenCalledWith(
      ws,
      expect.objectContaining({
        status: 'ok',
        client_message_id: 'c-1',
        message_id: '501',
        room_id: '99',
      })
    );
  });

  test('returns ack error for invalid payload', async () => {
    const ws = buildSocket();

    const prismaClient = {
      chat_message: {
        create: jest.fn(),
      },
    };

    const broadcaster = jest.fn();
    const ackSender = jest.fn();

    await handleRoomRealtimeMessage(
      ws,
      99,
      {
        type: 'chat_message',
        room_id: '99',
      },
      { prismaClient, broadcaster, ackSender }
    );

    expect(prismaClient.chat_message.create).not.toHaveBeenCalled();
    expect(broadcaster).not.toHaveBeenCalled();
    expect(ackSender).toHaveBeenCalledWith(
      ws,
      expect.objectContaining({
        status: 'error',
        error: 'Invalid chat_message payload',
      })
    );
  });

  test('returns ack error for mismatched room_id', async () => {
    const ws = buildSocket();

    const prismaClient = {
      chat_message: {
        create: jest.fn(),
      },
    };

    const broadcaster = jest.fn();
    const ackSender = jest.fn();

    await handleRoomRealtimeMessage(
      ws,
      99,
      {
        type: 'chat_message',
        room_id: '100',
        content: 'hello',
      },
      { prismaClient, broadcaster, ackSender }
    );

    expect(prismaClient.chat_message.create).not.toHaveBeenCalled();
    expect(broadcaster).not.toHaveBeenCalled();
    expect(ackSender).toHaveBeenCalledWith(
      ws,
      expect.objectContaining({
        status: 'error',
        error: 'Invalid room_id for this connection',
      })
    );
  });

  test('typing events still broadcast', async () => {
    const ws = buildSocket();

    const broadcaster = jest.fn();

    await handleRoomRealtimeMessage(
      ws,
      77,
      {
        type: 'typing',
      },
      { broadcaster }
    );

    expect(broadcaster).toHaveBeenCalledWith(
      'chat_77',
      expect.objectContaining({
        type: 'typing',
        user_id: '21',
      })
    );
  });
});
