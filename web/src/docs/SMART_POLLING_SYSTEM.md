# Smart Polling System

This document describes the smart polling system implemented for notifications and chat functionality.

## Overview

The smart polling system replaces WebSocket connections with intelligent HTTP polling that adapts to user activity and page visibility.

## Features

### Notification Polling (`useNotificationPolling`)

- **Adaptive Intervals**: 3 seconds when active, 15 seconds when idle
- **Visibility Detection**: Pauses when tab is hidden (30 seconds interval)
- **Activity Tracking**: Monitors user interactions (mouse, keyboard, scroll, touch)
- **Timestamp Filtering**: Only fetches new notifications since last poll
- **Error Handling**: Graceful error handling with console logging

### Chat Polling (`useChatPolling`)

- **Message Pagination**: Loads messages in batches of 50
- **Real-time Updates**: Polls for new messages every 3-15 seconds
- **Room Updates**: Periodically fetches room list updates
- **Load More**: Supports loading older messages with pagination
- **Activity-based Intervals**: Same adaptive behavior as notifications

## Implementation Details

### Anti-Infinite-Loop Design

The polling hooks are designed to avoid infinite loops by:

1. **Using Refs**: All mutable state uses `useRef` instead of `useState`
2. **Stable Dependencies**: `useEffect` dependencies only include primitives
3. **No Function Dependencies**: Functions are not included in dependency arrays
4. **Inline Logic**: Polling logic is inlined in `useEffect` to avoid dependency issues

### Backend Support

#### Notifications (`/api/ai/notifications/`)
- Supports `?since={timestamp}` parameter for filtering
- Returns notifications ordered by creation date
- Includes all notification fields (id, title, message, type, etc.)

#### Chat Messages (`/api/chat/rooms/{roomId}/messages/`)
- Supports pagination with `?limit=50&offset=0`
- Supports polling with `?after_id={messageId}`
- Returns pagination metadata (has_more, total_count)
- Orders messages by creation date descending

## Usage

### Notifications

```typescript
import { useNotificationPolling } from '../hooks/useNotificationPolling';

const { isPolling, lastUpdate, error, refresh } = useNotificationPolling({
  enabled: true,
  onNewNotifications: (notifications) => {
    // Handle new notifications
    console.log('New notifications:', notifications);
  },
  onError: (error) => {
    console.error('Polling error:', error);
  }
});
```

### Chat

```typescript
import { useChatPolling } from '../hooks/useChatPolling';

const { isPolling, hasMoreMessages, loadMoreMessages } = useChatPolling({
  roomId: '123',
  enabled: true,
  onNewMessages: (messages) => {
    // Handle new messages
    console.log('New messages:', messages);
  },
  onRoomUpdate: (rooms) => {
    // Handle room updates
    console.log('Room updates:', rooms);
  }
});
```

## Console Logging

The system provides comprehensive console logging:

- `🔔` for notification polling events
- `💬` for chat polling events
- `🧪` for test utilities
- Error messages with context
- Activity and visibility changes

## Testing

Use the test utilities in the browser console:

```javascript
// Test notification polling
await testNotificationPolling();

// Test chat polling
await testChatPolling('room_id_here');
```

## Performance Considerations

1. **Adaptive Intervals**: Reduces server load when user is inactive
2. **Visibility Pausing**: Stops polling when tab is hidden
3. **Timestamp Filtering**: Only fetches new data
4. **Pagination**: Limits message loading to prevent memory issues
5. **Error Handling**: Graceful degradation on network issues

## Migration from WebSocket

The system is designed as a drop-in replacement for WebSocket functionality:

1. **Same Interface**: Callbacks work the same way
2. **Same Data Format**: Messages and notifications use existing formats
3. **Backward Compatible**: Existing code continues to work
4. **Easy Rollback**: WebSocket code is commented, not removed

## Future Enhancements

1. **Exponential Backoff**: On repeated errors
2. **Connection Quality Detection**: Adjust intervals based on network
3. **Offline Support**: Queue messages when offline
4. **Push Notifications**: Integrate with browser push API
5. **WebSocket Fallback**: Automatic fallback to WebSocket when available
