# WebSocket Chat Implementation - Microservice Architecture

## Overview
This document outlines the WebSocket-based real-time chat system for SkillSwap using microservice architecture with Redis pub/sub for communication between the main server and WebSocket service.

## Architecture

### Components

#### 1. **Main Backend Server** (Port 5000)
- REST API endpoints for chat management
- Database operations (MongoDB)
- Message queue integration
- Pub/Sub publisher for WebSocket service

#### 2. **WebSocket Microservice** (Port 8000)
- Handles real-time WebSocket connections
- Manages Socket.io events
- Subscribes to Redis pub/sub channels
- Stores/retrieves messages from MongoDB

#### 3. **Redis**
- Pub/Sub messaging between services
- Queue management
- Session caching

#### 4. **MongoDB**
- Persistent message storage
- Chat history
- User conversations

### Communication Flow

```
Frontend (React)
    ↓
    ├─→ REST API (Main Server:5000) ← for history, conversations
    │
    └─→ WebSocket (WS Service:8000) ← for real-time chat
            ↓
        Redis Pub/Sub
            ↓
        Main Server (publishes events)
```

## Installation & Setup

### WebSocket Service Setup

```bash
cd WebSocketService
npm install
```

Create `.env` file:
```
REDIS_URL=redis://localhost:6379
DATABASE_URL=mongodb://localhost:27017/skillswap
WEBSOCKET_PORT=8000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

Start the service:
```bash
npm run dev
# or
npm start
```

### Frontend Setup

Install socket.io-client:
```bash
npm install socket.io-client
```

## API Endpoints

### Chat Routes (Main Server)

#### Get All Conversations
```
GET /api/chat/conversations
Headers: Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "conversationId": "userId1_userId2",
      "lastMessage": "Hello there!",
      "lastMessageTime": "2024-11-16T10:30:00Z",
      "unreadCount": 2,
      "otherUserId": "userId2",
      "otherUser": {
        "_id": "userId2",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

#### Get Chat History
```
GET /api/chat/history/:targetUserId?limit=50&page=1
Headers: Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "messageId",
      "conversationId": "userId1_userId2",
      "senderId": { "_id": "userId1", "name": "Alice" },
      "receiverId": { "_id": "userId2", "name": "Bob" },
      "message": "Hi Bob!",
      "messageType": "text",
      "isRead": true,
      "createdAt": "2024-11-16T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "pages": 2
  }
}
```

#### Get Unread Count
```
GET /api/chat/unread-count
Headers: Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "unreadCount": 5
}
```

#### Mark Conversation as Read
```
PUT /api/chat/mark-read/:targetUserId
Headers: Authorization: Bearer <token>
```

#### Delete Message
```
DELETE /api/chat/message/:messageId
Headers: Authorization: Bearer <token>
```

#### Delete Conversation
```
DELETE /api/chat/conversation/:targetUserId
Headers: Authorization: Bearer <token>
```

#### Search Messages
```
GET /api/chat/search?query=hello&targetUserId=userId2
Headers: Authorization: Bearer <token>
```

## WebSocket Events

### Client to Server

#### user_join
Emitted when user connects:
```javascript
socket.emit('user_join', userId);
```

#### start_chat
Initialize chat with another user:
```javascript
socket.emit('start_chat', {
    userId: 'currentUserId',
    targetUserId: 'targetUserId'
});
```

#### send_message
Send a message:
```javascript
socket.emit('send_message', {
    userId: 'currentUserId',
    targetUserId: 'targetUserId',
    message: 'Hello!'
});
```

#### user_typing
Notify typing:
```javascript
socket.emit('user_typing', {
    userId: 'currentUserId',
    targetUserId: 'targetUserId'
});
```

#### user_stop_typing
Stop typing notification:
```javascript
socket.emit('user_stop_typing', {
    userId: 'currentUserId',
    targetUserId: 'targetUserId'
});
```

#### load_chat_history
Load previous messages:
```javascript
socket.emit('load_chat_history', {
    userId: 'currentUserId',
    targetUserId: 'targetUserId',
    limit: 50
});
```

#### mark_as_read
Mark messages as read:
```javascript
socket.emit('mark_as_read', {
    conversationId: 'userId1_userId2',
    messageIds: ['msgId1', 'msgId2']
});
```

#### end_chat
End conversation:
```javascript
socket.emit('end_chat', {
    userId: 'currentUserId',
    targetUserId: 'targetUserId'
});
```

### Server to Client

#### new_message
Receive new message:
```javascript
socket.on('new_message', (message) => {
    console.log('Message:', message);
    // {
    //   _id, conversationId, senderId, receiverId,
    //   message, messageType, isRead, createdAt
    // }
});
```

#### message_sent
Confirmation message sent:
```javascript
socket.on('message_sent', (message) => {
    // { _id, senderId, message, createdAt }
});
```

#### user_typing
User is typing:
```javascript
socket.on('user_typing', (data) => {
    // { userId, conversationId }
});
```

#### user_stop_typing
User stopped typing:
```javascript
socket.on('user_stop_typing', (data) => {
    // { userId, conversationId }
});
```

#### chat_history
Chat history loaded:
```javascript
socket.on('chat_history', (data) => {
    // { conversationId, messages: [...] }
});
```

#### messages_read
Messages marked as read:
```javascript
socket.on('messages_read', (data) => {
    // { messageIds: [...], readAt }
});
```

#### chat_started
Remote user started chat:
```javascript
socket.on('chat_started', (data) => {
    // { conversationId, initiatorId }
});
```

#### chat_ended
Chat session ended:
```javascript
socket.on('chat_ended', (data) => {
    // { conversationId, userId }
});
```

#### user_status_change
User online/offline status:
```javascript
socket.on('user_status_change', (data) => {
    // { type: 'user_online'|'user_offline', userId, timestamp }
});
```

## Frontend Integration

### Chat Component Usage

```javascript
import Chat from './components/Chat';

<Chat
    userId={currentUser._id}
    targetUserId={selectedUser._id}
    targetUserName={selectedUser.name}
/>
```

### Environment Variables

Add to `.env`:
```
REACT_APP_WEBSOCKET_URL=http://localhost:8000
```

## Database Models

### ChatMessage Schema
```
{
  conversationId: String (index)
  senderId: ObjectId (ref: User)
  receiverId: ObjectId (ref: User)
  message: String
  messageType: 'text' | 'image' | 'file'
  attachmentUrl: String (optional)
  isRead: Boolean
  readAt: Date
  deletedAt: Date (soft delete)
  createdAt: Date
  updatedAt: Date
}

Indexes:
- { conversationId: 1, createdAt: -1 }
- { senderId: 1, receiverId: 1 }
- { receiverId: 1, isRead: 1 }
```

## Pub/Sub Channels

### Redis Channels

1. **chat:{conversationId}**
   - Messages in specific conversation
   - Published by WebSocket service
   - Subscribed by main server

2. **chat:{conversationId}:read**
   - Read status updates
   - Published by WebSocket service

3. **user_status**
   - User online/offline events
   - Published by WebSocket service
   - Subscribed by all services

4. **incoming_message**
   - Messages from main server
   - Published by main server
   - Subscribed by WebSocket service

## Features

### Real-time Chat
- Instant message delivery
- Read receipts
- Typing indicators

### Message Management
- Send/receive text messages
- Message history
- Soft delete messages
- Search messages

### User Status
- Online/offline tracking
- Active conversations
- Typing notifications

### Performance
- Message pagination
- Indexed queries
- Connection pooling
- Graceful reconnection

## Testing

### WebSocket Service Health Check
```bash
curl http://localhost:8000/health
```

### Check Active Connections
```bash
curl http://localhost:8000/stats
```

## Deployment Checklist

- [ ] Set correct environment variables
- [ ] Configure Redis connection
- [ ] Setup MongoDB replica set (for transactions)
- [ ] Enable CORS on both services
- [ ] Configure firewall for ports 5000, 8000
- [ ] Setup SSL certificates for production
- [ ] Configure logging and monitoring
- [ ] Setup automatic reconnection
- [ ] Enable message persistence
- [ ] Configure backup strategy

## Performance Optimization

### Connection Optimization
- Connection pooling
- Message batching
- Room-based broadcasting

### Database Optimization
- Index on conversationId
- Pagination for history
- Soft deletes (no removal)

### Pub/Sub Optimization
- Channel-specific subscriptions
- Message compression
- Batch acknowledgments

## Troubleshooting

### Messages Not Delivering
1. Check WebSocket service is running: `curl http://localhost:8000/health`
2. Verify Redis connection
3. Check browser console for errors
4. Verify user IDs match

### Connection Issues
1. Check CORS settings
2. Verify port accessibility
3. Check firewall rules
4. Review server logs

### Performance Issues
1. Monitor active connections: `/stats`
2. Check database query performance
3. Monitor Redis memory usage
4. Review message queue status

## Future Enhancements

1. **Group Chat**: Support multiple users in one chat
2. **File Sharing**: Upload images/documents
3. **Message Encryption**: End-to-end encryption
4. **Reactions**: Emoji reactions to messages
5. **Voice/Video**: Real-time audio/video calls
6. **Message Threads**: Reply to specific messages
7. **Rich Text**: Markdown/formatting support
8. **Scheduled Messages**: Schedule messages for later
