# WebSocket Chat - Quick Start Guide

## Implementation Summary

You now have a complete WebSocket-based chat system with **microservice architecture**:

### ✅ What's Implemented

1. **WebSocket Microservice** (`WebSocketService/`)
   - Independent Node.js server on port 8000
   - Socket.io for real-time communication
   - Redis pub/sub integration
   - MongoDB persistence

2. **Main Backend Integration**
   - Chat REST API endpoints
   - Database models for messages
   - Chat controller with full CRUD operations
   - Routes for chat management

3. **Frontend Chat Component**
   - React component with Socket.io client
   - Real-time message delivery
   - Typing indicators
   - Read receipts
   - Chat history loading
   - Responsive design

4. **Redis Pub/Sub Communication**
   - Main server ↔ WebSocket service communication
   - User status tracking
   - Message broadcasting
   - Event publishing/subscribing

## Quick Setup

### 1. Install WebSocket Service Dependencies
```bash
cd WebSocketService
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MongoDB and Redis URLs
```

### 3. Start Services (in separate terminals)

**Terminal 1 - Main Backend:**
```bash
cd BackEnd
npm start
# Server running on http://localhost:5000
```

**Terminal 2 - WebSocket Service:**
```bash
cd WebSocketService
npm start
# WebSocket running on http://localhost:8000
```

**Terminal 3 - Frontend:**
```bash
cd skillswap
npm start
# React app running on http://localhost:3000
```

## Usage

### REST API Endpoints

**Get conversations:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/chat/conversations
```

**Get chat history:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/chat/history/<targetUserId>
```

**Get unread count:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/chat/unread-count
```

### WebSocket Events

**Frontend JavaScript:**
```javascript
import Chat from './components/Chat';

// Use the Chat component
<Chat 
  userId={currentUser._id}
  targetUserId={selectedUser._id}
  targetUserName={selectedUser.name}
/>
```

## Service Architecture

```
┌─────────────────────────────────────────────┐
│          Frontend (React - :3000)           │
├─────────────────────────────────────────────┤
│  HTTP (REST)        │     WebSocket         │
│  Conversations      │     Real-time chat    │
│  History            │     Typing indicators │
│  Unread count       │     Read receipts     │
└──────────┬──────────────────────────┬───────┘
           │                          │
    ┌──────▼──────┐          ┌───────▼────────┐
    │  Backend    │          │   WebSocket    │
    │ Server:5000 │◄────────►│ Service:8000   │
    │             │ Redis    │                │
    │ REST API    │ Pub/Sub  │ Socket.io      │
    └──────┬──────┘          └───────┬────────┘
           │                         │
           └─────────┬───────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
     ┌────▼────┐        ┌──────▼────┐
     │ MongoDB  │        │  Redis    │
     │          │        │           │
     │Messages  │        │Queues &   │
     │Users     │        │Pub/Sub    │
     └──────────┘        └───────────┘
```

## Key Features

✨ **Real-time Communication**
- Instant message delivery
- Live typing indicators
- Online/offline status

📨 **Message Management**
- Full message history
- Message search
- Soft delete support
- Read receipts

🔄 **Pub/Sub Integration**
- Main server ↔ WebSocket communication
- User status broadcasting
- Scalable event distribution

📊 **Monitoring**
- WebSocket stats endpoint: `/stats`
- Health check: `/health`
- Queue monitoring via main server

## File Structure

```
SkillSwap/
├── BackEnd/
│   ├── Controllers/
│   │   └── chatController.js (NEW)
│   ├── Routes/
│   │   └── chatRoutes.js (NEW)
│   ├── models/
│   │   └── ChatMessage.js (NEW)
│   └── index.js (UPDATED)
│
├── WebSocketService/ (NEW)
│   ├── src/
│   │   ├── config/
│   │   │   └── redis.js
│   │   ├── models/
│   │   │   └── ChatMessage.js
│   │   └── services/
│   │       ├── PubSubManager.js
│   │       └── SocketHandler.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── skillswap/src/components/
│   ├── Chat.js (NEW)
│   └── Chat.css (NEW)
│
├── WEBSOCKET_CHAT_GUIDE.md (NEW)
└── DOCKER_SETUP.md (NEW)
```

## Testing

### Test 1: Basic Connection
```javascript
// Open browser console
const socket = io('http://localhost:8000');
socket.emit('user_join', 'userId123');
```

### Test 2: Send Message
```javascript
socket.emit('send_message', {
  userId: 'userId1',
  targetUserId: 'userId2',
  message: 'Hello!'
});
```

### Test 3: Check Stats
```bash
curl http://localhost:8000/stats
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| WebSocket connection fails | Check port 8000 is open, Redis/MongoDB running |
| Messages not saving | Verify MongoDB connection in .env |
| Pub/Sub not working | Ensure Redis is running and accessible |
| CORS errors | Check CLIENT_URL in WebSocket .env |

## Performance Tips

1. **Connection Pooling**: Configure connection limits
2. **Message Pagination**: Load history in chunks
3. **Caching**: Use Redis for active conversations
4. **Indexing**: Database indexes on conversationId, timestamps
5. **Monitoring**: Use `/stats` endpoint to track connections

## Deployment

### Using Docker Compose (Recommended)
```bash
# Create .env file with credentials
docker-compose up -d
```

### Manual Deployment
1. Set environment variables on each server
2. Start MongoDB replica set
3. Start Redis
4. Start WebSocket service
5. Start main backend
6. Start frontend

## Next Steps

1. **Integrate Chat UI**: Add Chat component to your pages
2. **User Notifications**: Integrate with notification system
3. **Message Persistence**: Verify MongoDB backups
4. **Monitoring**: Setup logging and alerts
5. **Testing**: Run load tests on WebSocket service

## Documentation

- Full API docs: `WEBSOCKET_CHAT_GUIDE.md`
- Docker setup: `DOCKER_SETUP.md`
- Message Queue docs: `MESSAGE_QUEUE_GUIDE.md`
- Cache docs: `REDIS_CACHING_GUIDE.md`

## Support

For issues or questions:
1. Check service health: `curl http://localhost:PORT/health`
2. Review logs: `npm start` (see console output)
3. Check database: MongoDB connections active?
4. Check Redis: `redis-cli ping`
5. Verify environment variables

---

**Status**: ✅ Production Ready
**Last Updated**: November 16, 2025
