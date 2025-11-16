# Chat System Architecture & Flow Diagrams

## Overall System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         SKILLSWAP CHAT SYSTEM                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              FRONTEND (React - Port 3000)                   │   │
│  │                                                             │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  Header.js - Navigation Bar                          │  │   │
│  │  │  [ Home ] [ Search ] [ Profile ] [ 💬 Messages ] ← NEW  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                            ↓                               │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  ChatPage.js - Conversations List                   │  │   │
│  │  │  ┌────────────────────────────────────────────────┐ │  │   │
│  │  │  │ 👤 John Doe          [ Last message ]         │ │  │   │
│  │  │  │ 👤 Sarah Smith       [ 3 unread ] ← NEW       │ │  │   │
│  │  │  │ 👤 Mike Johnson      [ Last message ]         │ │  │   │
│  │  │  └────────────────────────────────────────────────┘ │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                            ↓ (click to open)             │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  Chat.js - Real-time Chat                           │  │   │
│  │  │                                                      │  │   │
│  │  │  John Doe          [🟢 Online] ← Connection Status  │  │   │
│  │  │  ┌──────────────────────────────────────────────┐   │  │   │
│  │  │  │ [Me]     Hello!                       [✓✓]   │   │  │   │
│  │  │  │ [John]   Hi there! How are you?            │   │  │   │
│  │  │  │ [Me]     Great! How's the project?   [✓]   │   │  │   │
│  │  │  │ [John]   John is typing... 💬 ← Typing Ind │   │  │   │
│  │  │  └──────────────────────────────────────────────┘   │  │   │
│  │  │  [ Type message... ] [ Send ]                       │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                  ↓ Socket.io                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │            WEBSOCKET SERVICE (Node.js - Port 8000)         │   │
│  │                                                             │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  server.js - Main Entry Point                        │  │   │
│  │  │  • Initialize Socket.io server                       │  │   │
│  │  │  • CORS enabled for localhost:3000                   │  │   │
│  │  │  • Health check endpoint (/health)                   │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                          ↓                                  │   │
│  │  ┌────────────────────┐      ┌────────────────────────┐   │   │
│  │  │ SocketHandler.js   │      │ PubSubManager.js       │   │   │
│  │  │                    │      │                        │   │   │
│  │  │ Events:            │      │ Pub/Sub Channels:      │   │   │
│  │  │ • user_join        │◄────►│ • chat:convId          │   │   │
│  │  │ • start_chat       │      │ • user_status          │   │   │
│  │  │ • send_message     │      │ • incoming_message     │   │   │
│  │  │ • user_typing      │      │ • activity_log         │   │   │
│  │  │ • mark_as_read     │      │                        │   │   │
│  │  │ • end_chat         │      │                        │   │   │
│  │  │ • disconnect       │      │                        │   │   │
│  │  └────────────────────┘      └────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                  ↓ REST API & Pub/Sub              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │          BACKEND SERVER (Node.js/Express - Port 5000)       │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  chatRoutes.js                                         │ │  │
│  │  │  Routes:                                               │ │  │
│  │  │  • GET  /conversations  - List all conversations       │ │  │
│  │  │  • GET  /history/:userId - Message history            │ │  │
│  │  │  • GET  /unread-count - Unread message count          │ │  │
│  │  │  • PUT  /mark-read/:userId - Mark as read             │ │  │
│  │  │  • DELETE /message/:id - Delete message               │ │  │
│  │  │  • DELETE /conversation/:userId - Delete conversation │ │  │
│  │  │  • GET  /search - Search messages                     │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                          ↓                                   │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  chatController.js                                     │ │  │
│  │  │  • getUserConversations()                              │ │  │
│  │  │  • getChatHistory()                                    │ │  │
│  │  │  • getUnreadCount()                                    │ │  │
│  │  │  • markConversationAsRead()                            │ │  │
│  │  │  • deleteMessage()                                     │ │  │
│  │  │  • deleteConversation()                                │ │  │
│  │  │  • searchMessages()                                    │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                  ↓                                  │
│  ┌──────────────────────────┐              ┌──────────────────────┐ │
│  │  MONGODB (Port 27017)    │              │  REDIS (Port 6379)   │ │
│  │                          │              │                      │ │
│  │  Collections:            │              │  Features:           │ │
│  │  • chatmessages          │              │  • Pub/Sub channels  │ │
│  │    - _id                 │              │  • Session cache     │ │
│  │    - conversationId      │              │  • Message queue     │ │
│  │    - senderId            │              │  • User presence     │ │
│  │    - receiverId          │              │  • Activity logs     │ │
│  │    - message (text)      │              │                      │ │
│  │    - messageType         │              │                      │ │
│  │    - isRead              │              │                      │ │
│  │    - readAt              │              │                      │ │
│  │    - deletedAt           │              │                      │ │
│  │    - createdAt/updatedAt │              │                      │ │
│  │                          │              │                      │ │
│  │  Indexes:                │              │                      │ │
│  │  • conversationId, -createdAt│          │                      │ │
│  │  • senderId, receiverId   │              │                      │ │
│  │  • receiverId, isRead     │              │                      │ │
│  └──────────────────────────┘              └──────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Message Flow Diagram

```
USER A                          WEBSOCKET SERVICE                    USER B
  │                                    │                               │
  ├─[Socket Connected]──────────────────│                               │
  │                                     ├─[user_join]────────────────► │
  │                                     │                        (Store │
  │                                     │                         Socket│
  │                                     │                            ID)│
  │                                     │                               │
  ├─[start_chat with User B]────────────│                               │
  │                                     ├─[Subscribe to chat:convId]    │
  │                                     │  via PubSubManager            │
  │                                     │                               │
  │                                     │                       ┌──[Connected]
  │                                     │                       │
  ├─[send_message]──────────────────────│                       │
  │  msg: "Hello!"                      ├─[Save to MongoDB]    │
  │  conversationId: convId             │  chatmessages        │
  │  senderId: A_id                     │                       │
  │  receiverId: B_id                   ├─[Publish to Redis]───┤
  │  isRead: false                      │  channel: chat:convId │
  │                                     │                       │
  │  [Response: message_sent]◄──────────┤                       │
  │                                     │  [Subscribe listening]
  │                                     │                       │
  │                                     ├─[Emit new_message]───┤
  │                                     │  via Socket.io        │
  │  [User A sees ✓ - sent]             │                   ┌──[Message appears]
  │                                     │                   │  [User B sees ✓✓]
  │  [Type message]                     │                   │
  │  "typing..."                        │                   │
  ├─[user_typing]───────────────────────│                   │
  │                                     ├─[Publish to Redis]───┤
  │                                     │                       │
  │                                     ├─[Emit user_typing]───┤
  │                                     │                   ┌──[Show typing indicator]
  │                                     │                   │
  │  [Stop typing - 3sec timeout]       │                   │
  ├─[user_stop_typing]───────────────────│                   │
  │                                     ├─[Emit user_stop_typing]
  │                                     │                   ┌──[Hide indicator]
  │                                     │                   │
  │  [User B opens chat window]         │                   │
  │                                     │                   │
  │                                     │◄─[load_chat_history]
  │                                     │  (from DB)
  │                                     │                       │
  │                                     ├─[Fetch from MongoDB]  │
  │                                     │  Last 50 messages     │
  │                                     │                       │
  │                                     ├─[Emit chat_history]──┤
  │  [Load from API]◄───────────────────┤                   ┌──[Display history]
  │                                     │                   │
  │  [User B's app detects unread]      │                   │
  │  msg.receiverId == B_id && !isRead  │                   │
  │                                     │                   │
  │                                     │◄─[mark_as_read]──┤
  │                                     │  messageIds: [msg_id]
  │                                     │                       │
  │                                     ├─[Update in MongoDB]   │
  │                                     │  isRead: true         │
  │                                     │  readAt: timestamp    │
  │                                     │                       │
  │  [Listen to messages_read]◄─────────┤◄─[Publish to Redis]──┤
  │  msg.isRead changed to ✓✓           │                       │
  │                                     │                       │
```

## Component Hierarchy

```
App.js
├── Header.js
│   └── Links to: Home, Search, Profile, Chat ✅ NEW
│
├── Router
│   ├── / → Home.js
│   ├── /search → SkillSearch.js
│   ├── /profile → Profile.js
│   ├── /chat → ChatPage.js ✅ NEW
│   │   └── Dialog with Chat.js ✅ ENHANCED
│   │       ├── Chat messages
│   │       ├── Typing indicator
│   │       ├── Read receipts
│   │       └── Input form
│   ├── /login → Login.js
│   └── /signup → SignUp.js
│
├── Footer.js
├── LoadingOverlay.js
└── ToastContainer (notifications)
```

## Data Flow - New Message

```
1. User Types & Sends Message
   ┌─────────────────────┐
   │  Chat Component     │
   │  handleSendMessage  │
   └──────────┬──────────┘
              │
              ▼
2. Socket Emit
   ┌─────────────────────────────────┐
   │ socket.emit('send_message', {    │
   │   userId: 'A',                  │
   │   targetUserId: 'B',            │
   │   message: 'Hello!',            │
   │   messageType: 'text'           │
   │ })                              │
   └──────────┬──────────────────────┘
              │ WebSocket
              ▼
3. WebSocket Service Receives
   ┌──────────────────────────────┐
   │ SocketHandler.js             │
   │ handler.send_message()       │
   └──────────┬───────────────────┘
              │
              ▼
4. Save to Database
   ┌──────────────────────────────┐
   │ MongoDB                      │
   │ chatmessages.insertOne({     │
   │   conversationId: 'A_B',     │
   │   senderId: 'A',             │
   │   receiverId: 'B',           │
   │   message: 'Hello!',         │
   │   isRead: false,             │
   │   createdAt: now             │
   │ })                           │
   └──────────┬───────────────────┘
              │
              ▼
5. Publish to Redis
   ┌──────────────────────────────┐
   │ PubSubManager.publish(       │
   │   'chat:A_B',               │
   │   { _id, message, ... }     │
   │ )                            │
   └──────────┬───────────────────┘
              │
              ▼
6. Emit Socket Event
   ┌──────────────────────────────┐
   │ io.to('chat:A_B').emit(      │
   │   'new_message', message     │
   │ )                            │
   └──────────┬───────────────────┘
              │
         ┌────┴─────┐
         │           │
         ▼           ▼
    User A      User B
    message    message
    appears    appears
    with ✓     with ✓
                immediately
```

## Event Sequence - Read Receipt

```
Timeline:
1. User A sends message
   message.isRead = false
   User A sees: ✓ (sent)

2. User B opens chat
   Chat component detects unread messages
   filter: msg.receiverId == B && !msg.isRead

3. User B's component emits mark_as_read
   socket.emit('mark_as_read', {
     conversationId: 'A_B',
     messageIds: [msg_id]
   })

4. WebSocket updates MongoDB
   chatmessages.updateMany(
     { _id: { $in: messageIds } },
     { 
       isRead: true,
       readAt: new Date()
     }
   )

5. WebSocket publishes to Redis
   PubSubManager.publish('messages_read', {
     conversationId: 'A_B',
     messageIds: [msg_id],
     readAt: timestamp
   })

6. WebSocket emits socket event
   io.to('chat:A_B').emit('messages_read', data)

7. User A's Chat component receives event
   Updates message state: isRead = true
   Display changes from ✓ to ✓✓

8. User B's Chat component receives event
   Updates message state: isRead = true
   Display shows timestamp read at
```

## State Management

```
Chat Component State:
├── messages: []              // Array of message objects
├── inputValue: ""            // Current input text
├── isTyping: false           // Is other user typing?
├── isLoading: false          // Loading history?
├── socket: null              // Socket.io instance
├── conversationId: null      // Current conversation
└── connectionStatus: "..."   // 'connected'|'disconnected'|'connecting'|'error'

ChatPage Component State:
├── conversations: []         // List of all conversations
├── loading: false            // Initial load state
├── error: ""                 // Error messages
├── selectedConversation: null // Currently selected
└── openChat: false           // Modal open/close
```

## Authentication Flow

```
1. User Logs In
   POST /login
   Returns: { token, user }

2. Frontend Stores Token
   localStorage.setItem('token', token)

3. Connect to WebSocket
   socket = io(url, {
     auth: { userId, token }
   })

4. WebSocket Validates
   SocketHandler middleware
   Verify JWT token
   Extract userId

5. API Requests
   axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

6. All Requests Include Token
   Authorization: Bearer eyJhbGc...
```

## Error Handling

```
Frontend Error Handling:
├── Connection Errors
│   └── Retry with exponential backoff
├── Message Errors
│   └── Show toast notification
├── Auth Errors
│   └── Redirect to login
└── Network Errors
    └── Show "Offline" status

Backend Error Handling:
├── Invalid Token
│   └── Emit 'message_error'
├── Database Errors
│   └── Emit 'message_error'
├── Validation Errors
│   └── Return error response
└── Socket Disconnection
    └── Cleanup user session
```

---

**Last Updated**: November 16, 2025
**Status**: ✅ Complete Documentation
