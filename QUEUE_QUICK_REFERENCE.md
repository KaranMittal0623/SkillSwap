# SkillSwap Message Queue - Quick Reference

## What Was Implemented?

A complete asynchronous message queue system using **Bull** and **Redis** to handle:
- ✉️ Email delivery (connection requests, registrations, milestones)
- 📊 Points tracking and milestone notifications
- 📝 User activity logging for analytics
- 🔔 Real-time notifications

## Key Changes Made

### 1. **New Files Created**
- `BackEnd/utils/queueManager.js` - Queue initialization and job submission
- `BackEnd/utils/jobProcessors.js` - Job processors for all queues
- `MESSAGE_QUEUE_GUIDE.md` - Detailed implementation guide

### 2. **Files Modified**
- `BackEnd/index.js` - Initialize queues and add monitoring endpoint
- `BackEnd/Controllers/sendConnectionRequest.js` - Use email queue instead of blocking send
- `BackEnd/Controllers/addUser.js` - Queue welcome email on registration
- `BackEnd/Controllers/incrementPoints.js` - Queue points updates and milestone notifications
- `BackEnd/package.json` - Added Bull dependency

## How to Use

### Import Queue Functions
```javascript
const { addEmailJob, addActivityLogJob, addPointsUpdateJob } = require('../utils/queueManager');
```

### Queue an Email
```javascript
await addEmailJob({
    to: 'user@example.com',
    subject: 'Your Subject',
    html: '<html>Content</html>'
});
```

### Log Activity
```javascript
await addActivityLogJob({
    userId: userId,
    action: 'connection_request_sent',
    targetUserId: targetId,
    timestamp: new Date()
});
```

## Monitoring

### Check Queue Status
```bash
GET http://localhost:5000/api/queue-stats
```

**Shows**:
- Number of waiting jobs
- Currently active jobs
- Completed jobs
- Failed jobs
- Delayed jobs

## Benefits

| Feature | Benefit |
|---------|---------|
| **Non-blocking** | API responds instantly, emails sent in background |
| **Retry Mechanism** | Automatic retry up to 3 times if email fails |
| **Scalable** | Can add multiple workers for high volume |
| **Reliable** | Jobs persist in Redis if app crashes |
| **Monitored** | Track queue status via API endpoint |

## Queue Details

| Queue | Retries | Purpose | Current Usage |
|-------|---------|---------|---|
| `email` | 3 | Send emails | Connection requests, registration, milestones |
| `notifications` | 2 | Real-time updates | Future: Push notifications, WebSocket |
| `points` | 3 | Track points | Award points, milestone detection |
| `activity` | 2 | Logging | User analytics and behavior tracking |

## Testing the Implementation

### 1. Register a User
```bash
POST /api/users/register
```
✓ Welcome email queued (not sent yet)
✓ Activity logged
✓ Response is instant

### 2. Send Connection Request
```bash
POST /api/users/send-connection-request
```
✓ Two emails queued (target + requester)
✓ Activity logged
✓ Response returns immediately

### 3. Check Queue Status
```bash
GET /api/queue-stats
```
✓ See all queued jobs
✓ Monitor processing status

## Environment Requirements

Ensure `.env` has:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
REDIS_HOST=localhost (optional, defaults to localhost)
REDIS_PORT=6379 (optional, defaults to 6379)
```

## Next Steps (Future Enhancements)

1. **Persistent Activity Logging** - Save activity logs to MongoDB
2. **WebSocket Integration** - Real-time notifications for users
3. **Bull Board Dashboard** - Visual queue management interface
4. **Separate Worker Process** - Run queues on dedicated service
5. **Job Prioritization** - High-priority jobs processed first
6. **Scheduled Jobs** - Cron-like periodic tasks

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Emails not sending | Check Redis running, verify SMTP credentials in .env |
| Jobs stuck in queue | Check Redis memory, review processor logs |
| Server won't start | Ensure Redis is running on port 6379 |
| Large queue backlog | Consider adding more workers or increasing concurrency |

## Architecture Diagram

```
User Request
    ↓
API Controller
    ↓
Queue Manager (addEmailJob, etc.)
    ↓
Redis Queue Storage
    ↓
Job Processor (emailProcessor, etc.)
    ↓
Action (Send Email, Log Activity, etc.)
    ↓
Response to User (Immediate, non-blocking)
```

## Key Takeaways

- ✅ All emails now sent asynchronously
- ✅ API responses are instant
- ✅ Failed emails auto-retry
- ✅ User activities are logged for analytics
- ✅ Scalable and reliable
- ✅ Easy to monitor via API endpoint
