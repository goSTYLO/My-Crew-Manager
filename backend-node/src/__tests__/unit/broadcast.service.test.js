import { joinRoom, leaveRoom, broadcast } from '../../services/broadcast.service.js';

describe('broadcast.service', () => {
  let mockWs1;
  let mockWs2;

  beforeEach(() => {
    mockWs1 = { readyState: 1, send: jest.fn() };
    mockWs2 = { readyState: 1, send: jest.fn() };
  });

  test('joinRoom adds ws to room', () => {
    joinRoom('room1', mockWs1);
    joinRoom('room1', mockWs2);
    broadcast('room1', { type: 'test' });
    expect(mockWs1.send).toHaveBeenCalledWith(JSON.stringify({ type: 'test' }));
    expect(mockWs2.send).toHaveBeenCalledWith(JSON.stringify({ type: 'test' }));
  });

  test('leaveRoom removes ws from room', () => {
    joinRoom('room1', mockWs1);
    joinRoom('room1', mockWs2);
    leaveRoom('room1', mockWs1);
    broadcast('room1', { type: 'test' });
    expect(mockWs1.send).not.toHaveBeenCalled();
    expect(mockWs2.send).toHaveBeenCalled();
  });

  test('broadcast does not send to closed connections', () => {
    mockWs1.readyState = 0;
    joinRoom('room1', mockWs1);
    broadcast('room1', { type: 'test' });
    expect(mockWs1.send).not.toHaveBeenCalled();
  });

  test('broadcast to non-existent room does nothing', () => {
    broadcast('nonexistent', { type: 'test' });
    expect(mockWs1.send).not.toHaveBeenCalled();
  });

  test('broadcast handles string payload', () => {
    joinRoom('room1', mockWs1);
    broadcast('room1', 'raw string');
    expect(mockWs1.send).toHaveBeenCalledWith('raw string');
  });
});
