# SkillSwap - Troubleshooting & FAQ

## Common Issues & Solutions

### 🔴 WebSocket Connection Issues

#### **Problem: WebSocket won't connect (ERR_CONNECTION_REFUSED)**
```
Error: connect ECONNREFUSED 127.0.0.1:8000
```

**Solutions:**
1. Check if WebSocket service is running:
   ```bash
   curl http://localhost:8000/health
   ```
2. Start WebSocket service:
   ```bash
   cd WebSocketService
   npm start
   ```
3. Verify port 8000 is not blocked:
   ```bash
   netstat -an | grep 8000
   ```
4. Check firewall settings
5. Verify CLIENT_URL in WebSocket .env matches frontend URL

---

#### **Problem: CORS errors**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**
1. Check `.env` CLIENT_URL matches your frontend URL:
   ```env
   CLIENT_URL=http://localhost:3000
   ```
2. Restart WebSocket service after env change
3. Clear browser cache and cookies
4. Check browser console for exact error
5. Verify CORS middleware in server.js

---

#### **Problem: WebSocket connected but no messages**
```
Message sent but nothing received
```

**Solutions:**
1. Check conversation ID format (should be `userId1_userId2`)
2. Verify both users are in the same conversation:
   ```javascript
   socket.emit('start_chat', {
     userId: 'user1',
     targetUserId: 'user2'
   });
   ```
3. Check Redis is running:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```
4. Check MongoDB connection
5. Review WebSocket service logs
6. Verify message in DB: `db.chatmessages.find()`

---

### 🔴 Database Connection Issues

#### **Problem: MongoDB connection failed**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**
1. Start MongoDB:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Windows (if installed)
   net start MongoDB
   
   # Linux
   sudo systemctl start mongod
   ```
2. Check MongoDB is running:
   ```bash
   mongo --version
   ```
3. Verify connection string in .env:
   ```env
   DATABASE_URL=mongodb://localhost:27017/skillswap
   ```
4. Check MongoDB port (default 27017)
5. Verify database exists:
   ```bash
   mongo
   > show dbs
   ```

---

#### **Problem: ChatMessage collection not created**
```
MongoError: ns does not exist
```

**Solutions:**
1. Create collection manually:
   ```bash
   mongo
   > use skillswap
   > db.createCollection("chatmessages")
   ```
2. Or send first message (auto-creates)
3. Verify model is imported in server

---

### 🔴 Redis Issues

#### **Problem: Redis connection failed**
```
Error: Redis connection refused
```

**Solutions:**
1. Start Redis:
   ```bash
   # macOS
   brew services start redis
   
   # Linux
   sudo systemctl start redis-server
   
   # Docker
   docker run -d -p 6379:6379 redis:alpine
   ```
2. Check Redis is running:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```
3. Verify REDIS_URL in .env:
   ```env
   REDIS_URL=redis://localhost:6379
   ```
4. Check port 6379 is available:
   ```bash
   netstat -an | grep 6379
   ```

---

#### **Problem: Pub/Sub not working**
```
Messages not syncing between services
```

**Solutions:**
1. Verify Redis connection in both services
2. Check pub/sub channels in Redis:
   ```bash
   redis-cli
   > PUBSUB CHANNELS
   ```
3. Monitor Redis activity:
   ```bash
   redis-cli
   > SUBSCRIBE chat:*
   ```
4. Verify PubSubManager is initialized in WebSocket service
5. Check service logs for publish/subscribe errors

---

### 🔴 Email Queue Issues

#### **Problem: Emails not sending**
```
Email job failed after 3 attempts
```

**Solutions:**
1. Check email credentials in .env:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```
2. Verify app-specific password (not regular Gmail password)
3. Check queue status:
   ```bash
   curl http://localhost:5000/api/queue-stats
   ```
4. Review email processor logs
5. Check spam/trash folder
6. Test SMTP directly:
   ```bash
   telnet smtp.gmail.com 587
   ```

---

#### **Problem: Queue jobs stuck**
```
Jobs in "waiting" state not processing
```

**Solutions:**
1. Check if processor is running:
   ```bash
   # Should see in logs:
   # Email queue processor started
   # Activity queue processor started
   ```
2. Verify Redis memory:
   ```bash
   redis-cli info memory
   ```
3. Restart queue processor:
   ```bash
   # Restart backend
   npm start
   ```
4. Clear stuck jobs:
   ```bash
   # In Redis CLI
   redis-cli
   > FLUSHDB  # CAUTION: Clears all Redis data
   ```

---

### 🔴 Performance Issues

#### **Problem: Slow message delivery**
```
Messages take >2 seconds to appear
```

**Solutions:**
1. Check WebSocket service logs for delays
2. Monitor database query time:
   ```bash
   # In MongoDB
   db.chatmessages.find().explain("executionStats")
   ```
3. Verify indexes are created:
   ```bash
   db.chatmessages.getIndexes()
   ```
4. Check network latency:
   ```bash
   ping localhost
   ```
5. Monitor service resources:
   ```bash
   top  # CPU/Memory usage
   ```

---

#### **Problem: Memory leak**
```
Process memory increasing over time
```

**Solutions:**
1. Check for unclosed connections
2. Verify socket disconnection is working:
   ```javascript
   socket.on('disconnect', () => {
     // Should clean up resources
   });
   ```
3. Monitor WebSocket connections:
   ```bash
   curl http://localhost:8000/stats
   ```
4. Review logs for repeated connections
5. Restart service if memory > 500MB
6. Check for unresolved promises

---

### 🔴 Authentication Issues

#### **Problem: Authentication header missing**
```
Error: No authorization token provided
```

**Solutions:**
1. Verify token in localStorage:
   ```javascript
   console.log(localStorage.getItem('token'));
   ```
2. Check token expiration:
   ```javascript
   // In browser console
   const token = localStorage.getItem('token');
   const decoded = JSON.parse(atob(token.split('.')[1]));
   console.log(decoded.exp);
   ```
3. Re-login to get new token
4. Check Authorization header format:
   ```
   Authorization: Bearer <token>
   ```

---

#### **Problem: Token expired**
```
Error: JWT expired
```

**Solutions:**
1. Clear localStorage and login again:
   ```javascript
   localStorage.clear();
   window.location.reload();
   ```
2. Implement token refresh logic
3. Check token expiration time in JWT
4. Verify JWT_SECRET matches between services

---

### 🔴 API Endpoint Issues

#### **Problem: 404 Not Found on /api/chat endpoints**
```
Error: POST /api/chat/conversations 404 Not Found
```

**Solutions:**
1. Verify chatRoutes are imported in index.js:
   ```javascript
   const chatRoutes = require('./Routes/chatRoutes');
   app.use('/api/chat', chatRoutes);
   ```
2. Check route file exists: `BackEnd/Routes/chatRoutes.js`
3. Restart backend server
4. Verify correct endpoint URL

---

#### **Problem: 500 Internal Server Error**
```
Error: Internal Server Error
```

**Solutions:**
1. Check backend logs for error details
2. Verify database connection
3. Check for syntax errors in controller
4. Verify all required fields in request body
5. Test endpoint with curl:
   ```bash
   curl -X GET http://localhost:5000/api/chat/conversations \
     -H "Authorization: Bearer <token>"
   ```

---

### 🔴 Frontend Issues

#### **Problem: Chat component doesn't display**
```
Chat component not rendering
```

**Solutions:**
1. Check browser console for errors
2. Verify component is imported:
   ```javascript
   import Chat from './components/Chat';
   ```
3. Pass required props:
   ```jsx
   <Chat
     userId="user123"
     targetUserId="user456"
     targetUserName="John"
   />
   ```
4. Check CSS is included (Chat.css)
5. Verify dependencies installed:
   ```bash
   npm install socket.io-client axios
   ```

---

#### **Problem: Messages not sending**
```
Button click does nothing
```

**Solutions:**
1. Check WebSocket connection:
   ```javascript
   // In browser console
   window.socket?.connected  // Should be true
   ```
2. Verify input has value
3. Check for JavaScript errors in console
4. Verify emit event is correct:
   ```javascript
   socket.emit('send_message', {...})
   ```
5. Check network tab for request

---

### 🔴 Docker Issues

#### **Problem: Docker containers won't start**
```
Error: driver failed programming external connectivity
```

**Solutions:**
1. Check if ports are already in use:
   ```bash
   lsof -i :5000
   lsof -i :8000
   lsof -i :3000
   ```
2. Kill existing processes:
   ```bash
   kill -9 <PID>
   ```
3. Restart Docker daemon
4. Check Docker logs:
   ```bash
   docker-compose logs
   ```

---

#### **Problem: Services can't communicate**
```
Error: connect ECONNREFUSED
```

**Solutions:**
1. Use service names, not localhost:
   ```
   DATABASE_URL=mongodb://mongo:27017/skillswap
   REDIS_URL=redis://redis:6379
   ```
2. Verify network is created:
   ```bash
   docker network ls
   docker network inspect skillswap-network
   ```
3. Check service names in docker-compose.yml
4. Restart containers:
   ```bash
   docker-compose restart
   ```

---

## ✅ Diagnostic Commands

### **Check All Services**
```bash
# Backend
curl http://localhost:5000/health

# WebSocket
curl http://localhost:8000/health

# WebSocket stats
curl http://localhost:8000/stats

# Queue stats
curl http://localhost:5000/api/queue-stats
```

### **Check Databases**
```bash
# MongoDB
mongosh
> show dbs
> use skillswap
> db.chatmessages.count()

# Redis
redis-cli
> INFO
> DBSIZE
> KEYS *
```

### **Check Network**
```bash
# Port availability
netstat -an | grep -E '5000|6379|8000|27017'

# Connectivity
curl -v http://localhost:5000
curl -v http://localhost:8000
```

### **Check Logs**
```bash
# Backend logs
tail -f ./BackEnd/logs/*.log

# WebSocket logs
tail -f ./WebSocketService/logs/*.log

# System logs
dmesg | tail -20
```

---

## 🚨 Emergency Procedures

### **Reset Everything**
```bash
# Stop all services
docker-compose down

# Clear data (CAREFUL!)
docker volume prune
docker system prune

# Restart
docker-compose up -d
```

### **Clear Database**
```bash
# MongoDB
mongo skillswap
> db.dropDatabase()

# Redis
redis-cli
> FLUSHDB
```

### **Restart Individual Service**
```bash
# Backend
docker-compose restart backend

# WebSocket
docker-compose restart websocket

# Database
docker-compose restart mongo
```

---

## 📞 FAQ

**Q: Why is my message not appearing?**
A: Check WebSocket connection (browser console), verify Redis is running, check database has ChatMessage collection.

**Q: How do I check if services are running?**
A: Use health endpoints: `curl http://localhost:PORT/health`

**Q: Can I use production database locally?**
A: Not recommended. Use local MongoDB/Redis for development.

**Q: How do I clear message history?**
A: Either soft-delete via API or clear MongoDB collection.

**Q: Do I need Redis for development?**
A: Yes, it's required for pub/sub and queues.

**Q: Can I run without Docker?**
A: Yes, install MongoDB and Redis separately, then start services.

**Q: What if I forgot the database password?**
A: Reset in MongoDB: `db.changeUserPassword("username", passwordPrompt())`

---

## 🔧 Advanced Debugging

### **Enable Verbose Logging**
Add to your code:
```javascript
// Backend
process.env.DEBUG = '*';

// Frontend
window.SOCKET_DEBUG = true;

// Redis
redis-cli
> CONFIG SET loglevel debug
```

### **Monitor Live Activity**
```bash
# Monitor all Redis pub/sub
redis-cli
> SUBSCRIBE *

# Monitor WebSocket connections
curl -s http://localhost:8000/stats | jq .

# Monitor database queries
mongosh
> db.setProfilingLevel(1)
> db.system.profile.find().pretty()
```

---

## 📝 Support Checklist

Before asking for help, verify:
- ✅ All services are running (`/health` endpoints)
- ✅ MongoDB is accessible
- ✅ Redis is accessible
- ✅ Environment variables are set
- ✅ Ports are not blocked (5000, 8000, 3000, 27017, 6379)
- ✅ No conflicting processes on ports
- ✅ Network connectivity (no firewall blocking)
- ✅ Browser console shows no errors
- ✅ Database has required collections
- ✅ Logs don't show connection errors

---

**Last Updated**: November 16, 2025
**Maintained By**: Development Team
