// Simple test utilities for the polling system
export const testNotificationPolling = async () => {
  console.log('🧪 Testing notification polling...');
  
  const token = sessionStorage.getItem('token') || sessionStorage.getItem('access');
  if (!token) {
    console.error('❌ No auth token found');
    return;
  }

  try {
    const response = await fetch('/api/ai/notifications/?since=2024-01-01T00:00:00Z', {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Notification polling test successful:', data);
      return data;
    } else {
      console.error('❌ Notification polling test failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Notification polling test error:', error);
  }
};

export const testChatPolling = async (roomId: string) => {
  console.log('🧪 Testing chat polling...');
  
  const token = sessionStorage.getItem('token') || sessionStorage.getItem('access');
  if (!token) {
    console.error('❌ No auth token found');
    return;
  }

  try {
    const response = await fetch(`/api/chat/rooms/${roomId}/messages/?limit=10&offset=0`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Chat polling test successful:', data);
      return data;
    } else {
      console.error('❌ Chat polling test failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Chat polling test error:', error);
  }
};

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testNotificationPolling = testNotificationPolling;
  (window as any).testChatPolling = testChatPolling;
}
