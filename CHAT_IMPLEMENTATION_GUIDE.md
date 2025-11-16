# SkillSwap Chat Implementation Guide

## Overview

The SkillSwap chat system is fully implemented with real-time WebSocket communication. This guide explains how the chat feature works and how to use it.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ChatPage.js (Conversations List)                     │  │
│  └────────────────────┬────────────────────────────────┘  │
│                       │                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Chat.js (Real-time Chat Component)                   │  │
│  │  - Socket.io Client                                   │  │
│  │  - Message Handling                                   │  │
│  │  - Typing Indicators                                  │  │
│  └────────────────────┬────────────────────────────────┘  │
│                       │ Socket.io                          │
└───────────────────────┼──────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │   WebSocket Service (Port 8000)   │
        │   ┌─────────────────────────────┐ │
        │   │ Server.js                   │ │
        │   │ - Socket.io Server          │ │
        │   │ - Event Routing             │ │
        │   └──────────┬──────────────────┘ │
        │              │                    │
        │   ┌──────────┴──────────────────┐ │
        │   │                             │ │
        │ ┌─────────────────┐  ┌────────────────────┐ │
        │ │ SocketHandler   │  │ PubSubManager      │ │
        │ │ - user_join     │  │ - chat channels    │ │
        │ │ - start_chat    │  │ - message sync     │ │
        │ │ - send_message  │  │ - typing status    │ │
        │ │ - user_typing   │  │ - user presence    │ │
        │ │ - mark_as_read  │  └────────────────────┘ │
        │ └─────────────────┘        │                │
        │              │             ▼                │
        └──────────────┼────────────────────────────┘
                       │
        ┌──────────────┴────────────────────────────┐
        │        Redis (Port 6379)                  │
        │  - Pub/Sub Channels                       │
        │  - Message Queue Storage                  │
        │  - Session Cache                          │
        └──────────────┬─────────────────────────────┘
                       │
        ┌──────────────┴────────────────────────────┐
        │     Backend Server (Port 5000)            │
        │  ┌──────────────────────────────────────┐ │
        │  │ chatController.js                    │ │
        │  │ - getUserConversations()             │ │
        │  │ - getChatHistory()                   │ │
        │  │ - getUnreadCount()                   │ │
        │  │ - markConversationAsRead()           │ │
        │  │ - deleteMessage()                    │ │
        │  │ - deleteConversation()               │ │
        │  │ - searchMessages()                   │ │
        │  └──────────────┬───────────────────────┘ │
        │                 │                         │
        │  ┌──────────────┴───────────────────────┐ │
        │  │      MongoDB (Port 27017)            │ │
        │  │  - ChatMessage Collection            │ │
        │  │  - Message Persistence               │ │
        │  │  - Conversation History              │ │
        │  └──────────────────────────────────────┘ │
        │                                           │
        └───────────────────────────────────────────┘
```

## Features Implemented

### ✅ Real-time Messaging
- Live message delivery via WebSocket
- Message read receipts (✓✓ for read, ✓ for sent)
- Typing indicators with animation
- Connection status monitoring

### ✅ Message Management
- Persistent message storage in MongoDB
- Message history retrieval with pagination
- Soft delete support (deleted_at timestamp)
- Message search functionality

### ✅ Conversation Management
- Automatic conversation creation between users
- Unread message count
- Last message preview
- Conversation list with sorting

### ✅ User Presence
- Online/Offline status
- User activity tracking
- Real-time presence updates
- Automatic cleanup on disconnect

### ✅ Chat Interface
- Professional UI with gradient styling
- Message bubbles (sent/received)
- Animated typing indicators
- Responsive design for mobile
- Auto-scroll to latest message

## File Structure

```
Frontend (React):
  skillswap/src/components/
  ├── ChatPage.js          # Main chat page with conversation list
  ├── Chat.js              # Real-time chat component
  └── Chat.css             # Chat styling

Backend:
  BackEnd/
  ├── Controllers/
  │   └── chatController.js    # Chat business logic
  ├── Routes/
  │   └── chatRoutes.js        # Chat API endpoints
  └── models/
      └── ChatMessage.js       # MongoDB schema

WebSocket Service:
  WebSocketService/
  ├── server.js            # Main server entry point
  └── src/
      ├── services/
      │   ├── SocketHandler.js     # Socket.io event handlers
      │   └── PubSubManager.js     # Redis pub/sub manager
      └── models/
          └── ChatMessage.js       # Mongoose schema
```

## How to Use

### 1. Start All Services

```bash
# Terminal 1: Start Backend
cd BackEnd
npm start
# Should see: "Server is running on port 5000"

# Terminal 2: Start WebSocket Service
cd WebSocketService
npm start
# Should see: "WebSocket Service running on port 8000"

# Terminal 3: Start Frontend
cd skillswap
npm start
# Should open http://localhost:3000
```

### 2. Access Chat

1. **Login/Register** at http://localhost:3000/login
2. **Click "Messages"** button in the top navigation bar
3. **View Conversations** - List of all your active conversations
4. **Open Chat** - Click on a conversation to start chatting
5. **Send Message** - Type and press "Send"

### 3. Start New Conversation

1. Go to **"Search Skills"**
2. Find a user offering a skill
3. Click **"Request to Learn"**
4. After connection is accepted, conversation appears in **Messages**

## API Endpoints

All endpoints require authentication (Bearer token in Authorization header).

### Get Conversations
```
GET /api/chat/conversations
```
Returns list of all user conversations with unread count.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "conv123",
      "participants": [...],
      "unreadCount": 2,
      "lastMessage": "Hey, how are you?",
      "lastMessageTime": "2025-11-16T10:30:00Z"
    }
  ]
}
```

### Get Chat History
```
GET /api/chat/history/:targetUserId
Query: limit=50&page=1
```
Returns paginated message history.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "msg123",
      "conversationId": "conv123",
      "senderId": "user1",
      "receiverId": "user2",
      "message": "Hello!",
      "messageType": "text",
      "isRead": true,
      "createdAt": "2025-11-16T10:00:00Z"
    }
  ]
}
```

### Get Unread Count
```
GET /api/chat/unread-count
```
Returns total unread messages count.

### Mark Conversation as Read
```
PUT /api/chat/mark-read/:targetUserId
```
Mark all messages from a user as read.

### Delete Message
```
DELETE /api/chat/message/:messageId
```
Soft delete a message.

### Delete Conversation
```
DELETE /api/chat/conversation/:targetUserId
```
Delete entire conversation.

### Search Messages
```
GET /api/chat/search?q=query
```
Search messages by content.

## WebSocket Events

### Client → Server Events

#### `user_join`
```javascript
socket.emit('user_join', { userId: 'user123' });
```
Register user when they connect.

#### `start_chat`
```javascript
socket.emit('start_chat', {
  userId: 'user1',
  targetUserId: 'user2'
});
```
Initialize chat with another user.

#### `send_message`
```javascript
socket.emit('send_message', {
  userId: 'user1',
  targetUserId: 'user2',
  message: 'Hello!',
  messageType: 'text'
});
```
Send a message.

#### `user_typing`
```javascript
socket.emit('user_typing', {
  userId: 'user1',
  targetUserId: 'user2'
});
```
Notify typing status.

#### `user_stop_typing`
```javascript
socket.emit('user_stop_typing', {
  userId: 'user1',
  targetUserId: 'user2'
});
```
Stop typing notification.

#### `mark_as_read`
```javascript
socket.emit('mark_as_read', {
  conversationId: 'conv123',
  messageIds: ['msg1', 'msg2']
});
```
Mark messages as read.

#### `load_chat_history`
```javascript
socket.emit('load_chat_history', {
  userId: 'user1',
  targetUserId: 'user2',
  limit: 50
});
```
Load chat history.

#### `end_chat`
```javascript
socket.emit('end_chat', {
  userId: 'user1',
  targetUserId: 'user2'
});
```
End chat session.

### Server → Client Events

#### `new_message`
```javascript
socket.on('new_message', (message) => {
  // {
  //   _id: 'msg123',
  //   senderId: 'user2',
  //   receiverId: 'user1',
  //   message: 'Hello!',
  //   createdAt: '...'
  // }
});
```
New message received.

#### `message_sent`
```javascript
socket.on('message_sent', (message) => {
  // Message successfully sent confirmation
});
```

#### `user_typing`
```javascript
socket.on('user_typing', (data) => {
  // { userId: 'user2' }
});
```
Other user is typing.

#### `user_stop_typing`
```javascript
socket.on('user_stop_typing', (data) => {
  // { userId: 'user2' }
});
```
Other user stopped typing.

#### `chat_history`
```javascript
socket.on('chat_history', (data) => {
  // { conversationId: '...', messages: [...] }
});
```
Chat history loaded.

#### `messages_read`
```javascript
socket.on('messages_read', (data) => {
  // { messageIds: [...], readAt: '...' }
});
```
Messages marked as read by other user.

#### `message_error`
```javascript
socket.on('message_error', (data) => {
  // { error: 'Failed to save message' }
});
```
Error occurred.

## Environment Setup

### Frontend (.env)
```
REACT_APP_WEBSOCKET_URL=http://localhost:8000
REACT_APP_API_URL=http://localhost:5000
```

### Backend (.env)
```
PORT=5000
DATABASE_URL=mongodb://localhost:27017/skillswap
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
```

### WebSocket Service (.env)
```
PORT=8000
DATABASE_URL=mongodb://localhost:27017/skillswap
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:3000
```

## Testing the Chat

### Manual Testing

1. **Open Two Browser Tabs**
   - Login as User A in Tab 1
   - Login as User B in Tab 2

2. **Send Message from User A**
   - Go to Messages → Select conversation
   - Type message and send
   - Should appear in User B's chat instantly

3. **Test Typing Indicator**
   - Start typing in User A
   - Should see "typing..." in User B

4. **Test Read Receipts**
   - Send message from User A
   - Should show ✓ (sent)
   - When User B opens chat, should change to ✓✓ (read)

5. **Test Connection Status**
   - Close WebSocket service
   - Chat should show 🔴 Offline
   - Messages won't send
   - Restart service, should reconnect automatically

### Console Debugging

```javascript
// In browser console
window.socket?.connected        // Check if connected
window.socket?.id               // Socket ID
window.socket?.emit             // Send event manually
```

## Troubleshooting

### Chat not showing messages

1. **Check WebSocket connection**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status":"ok"}`

2. **Check MongoDB**
   ```bash
   mongosh skillswap
   > db.chatmessages.count()
   ```

3. **Check logs in browser console** for connection errors

### Messages not sending

1. **Verify userId and targetUserId** are passed correctly
2. **Check authentication token** is valid
3. **Verify WebSocket connected** (status should be green)

### Typing indicator not showing

1. Ensure both users are in the same conversation
2. Check `user_typing` event is being emitted
3. Verify Redis pub/sub is working

### Read receipts not updating

1. Check message has `receiverId` set correctly
2. Verify mark_as_read event is emitted
3. Check MongoDB has isRead field

## Performance Tips

1. **Message Pagination**: Load 50 messages at a time
2. **Debounce Typing**: Typing indicator waits 3 seconds
3. **Redis Caching**: Store active conversations in Redis
4. **Database Indexing**: Indexes on conversationId, senderId, receiverId
5. **Soft Delete**: Use deleted_at instead of hard delete

## Security Considerations

1. **Authentication**: All API calls require JWT token
2. **Authorization**: Users can only access their own conversations
3. **Input Validation**: Message length limits
4. **SQL Injection**: Use MongoDB queries safely
5. **XSS Prevention**: Messages sanitized in frontend

## Future Enhancements

- [ ] File/Image sharing
- [ ] Voice/Video calling integration
- [ ] Message reactions and emojis
- [ ] Message forwarding
- [ ] Group chats
- [ ] Chat encryption
- [ ] Message scheduling
- [ ] Chat analytics

## Support

For issues or questions, refer to:
- `TROUBLESHOOTING_GUIDE.md` - Common issues and solutions
- `WEBSOCKET_CHAT_GUIDE.md` - Detailed WebSocket documentation
- Backend logs in `BackEnd/logs/`
- WebSocket logs in `WebSocketService/logs/`

---

**Last Updated**: November 16, 2025
**Status**: ✅ Fully Implemented & Production Ready
