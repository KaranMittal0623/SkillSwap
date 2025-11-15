# Message Queue Implementation Guide - SkillSwap

## Overview
This document outlines the Bull-based message queue implementation integrated into the SkillSwap application. The system uses Redis as the backend for efficient job queuing and processing.

## Architecture

### Queues Implemented

#### 1. **Email Queue** (`emailQueue`)
- **Purpose**: Handle asynchronous email sending
- **Use Cases**:
  - Connection request notifications
  - Welcome emails for new registrations
  - Milestone achievement emails
  - Confirmation emails
- **Features**:
  - 3 retry attempts with exponential backoff
  - Automatic cleanup on completion
  - Email verification before sending

#### 2. **Notification Queue** (`notificationQueue`)
- **Purpose**: Process real-time notifications
- **Use Cases**:
  - Push notifications
  - In-app notifications
  - WebSocket updates
- **Features**:
  - 2 retry attempts
  - 1-second fixed delay between retries

#### 3. **Points Update Queue** (`pointsQueue`)
- **Purpose**: Track and process point updates
- **Use Cases**:
  - Award points for learning
  - Update leaderboards
  - Trigger milestone notifications
- **Features**:
  - 3 retry attempts
  - Exponential backoff strategy

#### 4. **Activity Queue** (`activityQueue`)
- **Purpose**: Log user activities for analytics
- **Use Cases**:
  - Track connection requests sent
  - Log user registrations
  - Monitor learning activities
  - User engagement analytics
- **Features**:
  - 2 retry attempts
  - Lightweight processing

## File Structure

```
BackEnd/
├── utils/
│   ├── queueManager.js        # Queue initialization and management
│   ├── emailProcessor.js      # Email job processor
│   └── jobProcessors.js       # Activity, points, and notification processors
├── Controllers/
│   ├── sendConnectionRequest.js (UPDATED)
│   ├── addUser.js (UPDATED)
│   └── incrementPoints.js (UPDATED)
└── index.js (UPDATED)
```

## Usage Examples

### 1. Adding Email Jobs

```javascript
const { addEmailJob } = require('../utils/queueManager');

// Send an email asynchronously
await addEmailJob({
    to: 'user@example.com',
    subject: 'Welcome to SkillSwap',
    html: '<h1>Welcome!</h1>'
});
```

### 2. Logging Activities

```javascript
const { addActivityLogJob } = require('../utils/queueManager');

await addActivityLogJob({
    userId: userId,
    action: 'connection_request_sent',
    targetUserId: targetId,
    skillInterested: 'JavaScript',
    timestamp: new Date()
});
```

### 3. Processing Points Updates

```javascript
const { addPointsUpdateJob } = require('../utils/queueManager');

await addPointsUpdateJob({
    userId: userId,
    skillName: 'Node.js',
    pointsAdded: 10,
    totalPoints: 150,
    timestamp: new Date()
});
```

## Integration Points

### sendConnectionRequest.js
- **Changes**: 
  - Removed synchronous email sending
  - Added queue-based email jobs for both participants
  - Added activity logging
- **Benefit**: Connection requests now return immediately without waiting for email delivery

### addUser.js
- **Changes**:
  - Queues welcome email on registration
  - Logs user registration activity
- **Benefit**: Faster registration process, improved UX

### incrementPoints.js
- **Changes**:
  - Queues points update events
  - Sends milestone emails when points reach 100 multiples
  - Logs learning activities
- **Benefit**: Non-blocking point updates, automated milestone notifications

## Monitoring Queue Status

### API Endpoint
```bash
GET /api/queue-stats
```

**Response Example:**
```json
{
  "success": true,
  "queues": {
    "email": {
      "waiting": 5,
      "active": 1,
      "completed": 150,
      "failed": 2,
      "delayed": 0
    },
    "notifications": {
      "waiting": 2,
      "active": 0,
      "completed": 45,
      "failed": 0,
      "delayed": 0
    },
    "points": {
      "waiting": 0,
      "active": 0,
      "completed": 320,
      "failed": 0,
      "delayed": 0
    },
    "activity": {
      "waiting": 1,
      "active": 0,
      "completed": 500,
      "failed": 0,
      "delayed": 0
    }
  }
}
```

## Configuration

### Retry Strategies

**Email Queue** - Exponential Backoff
- Attempt 1: Immediate
- Attempt 2: 2 seconds
- Attempt 3: 4 seconds

**Points & Activity Queues** - Fixed/Exponential
- Fast processing for real-time updates

### Concurrency
Each processor handles one job at a time (default Bull behavior). For production, consider increasing concurrency:

```javascript
queue.process(concurrency, processor);
```

## Performance Benefits

1. **Non-blocking Operations**: API responses return immediately
2. **Reliability**: Automatic retry mechanism prevents data loss
3. **Scalability**: Easy to add multiple workers
4. **Monitoring**: Built-in queue statistics
5. **Redis Integration**: Leverages existing Redis setup

## Future Enhancements

1. **Persistent Activity Logs**: Store activity logs in MongoDB
2. **Real-time Notifications**: Integrate WebSocket for live updates
3. **Job Scheduling**: Add cron-like tasks for periodic operations
4. **Dead Letter Queue**: Handle permanently failed jobs
5. **Worker Scaling**: Run queue processors on separate services
6. **Queue Dashboard**: Implement Bull Board for visual monitoring

## Troubleshooting

### Emails Not Sending
- Check Redis connection
- Verify SMTP credentials in .env
- Check queue stats endpoint for failed jobs
- Review logs for email processor errors

### Queue Jobs Stuck
- Check Redis memory usage
- Monitor processor logs
- Consider increasing retry attempts
- Clear completed jobs if queue grows too large

### Performance Issues
- Monitor active job count
- Check Redis performance
- Consider separate worker processes
- Implement job prioritization

## Best Practices

1. **Always use job data validation** before processing
2. **Set appropriate timeout values** for long-running tasks
3. **Monitor queue statistics** regularly
4. **Test processors** with various edge cases
5. **Implement proper error logging** for debugging
6. **Use meaningful job names** for tracking
7. **Keep job data structures simple** for serialization
