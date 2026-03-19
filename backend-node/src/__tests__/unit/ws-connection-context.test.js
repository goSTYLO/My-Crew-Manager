import { sendAuthExpiredAndClose } from '@/realtime/ws-connection-context.js';

describe('ws connection context', () => {
  test('sendAuthExpiredAndClose emits auth_expired payload and closes socket', () => {
    const ws = {
      readyState: 1,
      send: jest.fn(),
      close: jest.fn(),
    };

    sendAuthExpiredAndClose(ws, 'Authentication token expired');

    expect(ws.send).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(ws.send.mock.calls[0][0]);
    expect(payload.type).toBe('auth_expired');
    expect(payload.error).toBe('Authentication token expired');
    expect(payload.detail).toBe('Authentication token expired');
    expect(payload.message).toBe('Authentication token expired');
    expect(ws.close).toHaveBeenCalledWith(4001, 'auth_expired');
  });
});
