# 🚀 Chat Quick Start - Get Running in 5 Minutes

## Prerequisites
- ✅ MongoDB running (port 27017)
- ✅ Redis running (port 6379)
- ✅ Node.js installed

## Step 1: Start Backend (Port 5000)
```bash
cd BackEnd
npm start
```
Wait for: `"Server is running on port 5000"`

## Step 2: Start WebSocket Service (Port 8000)
```bash
cd WebSocketService
npm start
```
Wait for: `"WebSocket Service running on port 8000"`

## Step 3: Start Frontend (Port 3000)
```bash
cd skillswap
npm start
```
Should automatically open: `http://localhost:3000`

## Step 4: Test Chat

### Login as User A
1. Go to `/login`
2. Sign up or login with User A
3. Click "Messages" in navbar

### Login as User B (New Tab)
1. Open new tab at `http://localhost:3000`
2. Sign up or login with User B
3. Click "Search Skills"
4. Find User A's skill
5. Send connection request

### Start Chatting
1. User A: Refresh and check Messages
2. New conversation should appear
3. Click to open chat
4. Type and send messages

## Verify Everything Works

### Health Check
```bash
# Backend
curl http://localhost:5000/health

# WebSocket
curl http://localhost:8000/health
```

### Check Connection
In browser console (F12):
```javascript
// Should show connection info
console.log(document.title);
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot connect to WebSocket" | Verify WebSocket service running on port 8000 |
| "Messages not loading" | Check MongoDB is running and connected |
| "Authentication failed" | Clear localStorage and login again |
| "Typing indicator not working" | Verify Redis is running |

## File Structure
```
✅ Frontend: skillswap/src/components/
   ├── ChatPage.js (conversations list)
   ├── Chat.js (real-time chat)
   └── Chat.css (styling)

✅ Backend: BackEnd/
   ├── Controllers/chatController.js
   ├── Routes/chatRoutes.js
   └── models/ChatMessage.js

✅ WebSocket: WebSocketService/
   ├── server.js
   └── src/
       ├── services/SocketHandler.js
       ├── services/PubSubManager.js
       └── models/ChatMessage.js
```

## What's Implemented

✅ Real-time messaging with Socket.io
✅ Message persistence in MongoDB
✅ Typing indicators
✅ Read receipts (✓ sent, ✓✓ read)
✅ Conversation list with unread count
✅ Connection status indicator
✅ Responsive UI design
✅ Redis pub/sub for service communication
✅ Auto-reconnection on disconnect
✅ Message history pagination

## Next Steps

1. **Open Developer Tools** (F12) to see logs
2. **Send a message** and watch it appear in real-time
3. **Test typing** - see indicator on other user's screen
4. **Check browser network tab** to see WebSocket frames

## Debug Tips

```javascript
// Browser Console
// Check socket connection
window.socket?.connected

// Check active conversations
localStorage.getItem('token')

// Check WebSocket events in console
// Should see: emit, on, message events
```

## Full Documentation

For complete details, see:
- `CHAT_IMPLEMENTATION_GUIDE.md` - Full documentation
- `WEBSOCKET_CHAT_GUIDE.md` - WebSocket details
- `TROUBLESHOOTING_GUIDE.md` - Problem solving

---

**Total Setup Time**: ~2 minutes (excluding npm install)
**Ready to Chat**: Yes! ✅
