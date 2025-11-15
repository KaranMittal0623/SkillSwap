# Message Queue Testing Guide

## Prerequisites
- Redis running on localhost:6379
- Backend server running on localhost:5000
- Postman or similar API client

## Test Scenarios

### Test 1: User Registration with Queue
**Endpoint**: `POST /api/users/register`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "skillsOffered": ["JavaScript", "React"],
  "skillsWanted": ["Python", "Machine Learning"]
}
```

**Expected Behavior**:
1. ✓ Instant response (201 Created)
2. ✓ User created in database
3. ✓ Welcome email job added to queue
4. ✓ Activity log job added to queue

**Verify**:
```bash
GET /api/queue-stats
```
- `email.waiting` should be ≥ 1
- `activity.waiting` should be ≥ 1

---

### Test 2: Send Connection Request with Queue
**Endpoint**: `POST /api/users/send-connection-request`

**Headers**:
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "targetUserId": "target-user-id",
  "message": "I'd like to learn React from you!",
  "skillInterested": "React"
}
```

**Expected Behavior**:
1. ✓ Instant response (200 OK)
2. ✓ Two email jobs queued (one for target, one for requester)
3. ✓ Activity log job created

**Verify**:
```bash
GET /api/queue-stats
```
- `email.waiting` should increase by 2
- `email.completed` should increase over time
- Check console logs for job processing

---

### Test 3: Increment Points with Milestone
**Endpoint**: `POST /api/users/increment-points`

**Headers**:
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "user-id",
  "skillName": "JavaScript"
}
```

**Expected Behavior**:
1. ✓ Instant response (200 OK)
2. ✓ Points update job queued
3. ✓ Activity log job created
4. ✓ At every 100 points, milestone email queued

**Verify**:
```bash
GET /api/queue-stats
```
- `points.waiting` increases
- `activity.waiting` increases
- `email.waiting` increases when milestone reached

---

### Test 4: Queue Status Monitoring
**Endpoint**: `GET /api/queue-stats`

**Expected Response**:
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
      "waiting": 0,
      "active": 0,
      "completed": 10,
      "failed": 0,
      "delayed": 0
    },
    "points": {
      "waiting": 0,
      "active": 0,
      "completed": 25,
      "failed": 0,
      "delayed": 0
    },
    "activity": {
      "waiting": 2,
      "active": 0,
      "completed": 45,
      "failed": 0,
      "delayed": 0
    }
  }
}
```

**Key Metrics**:
- `waiting`: Jobs queued but not yet processed
- `active`: Currently processing
- `completed`: Successfully completed
- `failed`: Failed after all retries
- `delayed`: Scheduled for later

---

## Console Output Analysis

### Successful Email Job
```
Email job 1 added to queue
Email queue processor started
Email sent successfully to john@example.com. Message ID: <msgid>
Email job 1 completed successfully
```

### Successful Activity Job
```
Activity log job 2 added to queue
Activity queue processor started
Activity Log: {
  "jobId": 2,
  "userId": "123",
  "action": "connection_request_sent",
  "targetUserId": "456",
  ...
}
Activity logging job 2 completed successfully
```

### Failed Job with Retry
```
Email job 3 failed: Failed to connect to email server
(Attempt 1 of 3)
[Waiting 2 seconds before retry...]
Email job 3 failed: Failed to connect to email server
(Attempt 2 of 3)
[Waiting 4 seconds before retry...]
Email job 3 completed successfully
```

---

## Performance Testing

### Load Test: Bulk Registration
```bash
# Send 10 registration requests rapidly
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/users/register \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"User $i\",
      \"email\": \"user$i@test.com\",
      \"password\": \"pass123\",
      \"skillsOffered\": [\"Skill$i\"],
      \"skillsWanted\": [\"LearnskiLL$i\"]
    }"
done
```

**Monitor**:
```bash
# Check queue growth
watch -n 1 'curl -s http://localhost:5000/api/queue-stats | jq'
```

**Expected**:
- Initial spike in `email.waiting` and `activity.waiting`
- Jobs gradually move to `completed` state
- All jobs should complete within seconds

---

## Failure Scenarios

### Scenario 1: Redis Down
**What Happens**:
- API will throw Redis connection error
- Jobs cannot be queued
- Requests fail

**Recovery**:
```bash
# Restart Redis
redis-server

# Restart backend
npm run dev
```

### Scenario 2: Invalid Email Configuration
**What Happens**:
- Email jobs added to queue
- Processor fails with SMTP error
- Job retried 3 times then marked failed

**Fix**:
- Verify `EMAIL_USER` and `EMAIL_PASS` in `.env`
- Restart server
- Requeue failed jobs manually

### Scenario 3: Queue Overflow
**What Happens**:
- Too many jobs queued
- Redis memory increases
- Processing slows down

**Solution**:
```bash
# Monitor queue size
GET /api/queue-stats

# Clear completed jobs (if needed)
# This requires adding a cleanup endpoint

# Increase processing concurrency in jobProcessors.js
queue.process(5, processor); // Process 5 jobs in parallel
```

---

## Debugging Tips

### Check Redis Connection
```bash
redis-cli ping
# Should return: PONG
```

### Monitor Queue Activity
```bash
# Open terminal and watch queue stats
watch -n 2 'curl -s http://localhost:5000/api/queue-stats | jq'
```

### Check Server Logs
```bash
# Backend console should show:
# [Job added to queue]
# [Job processing...]
# [Job completed]
```

### Enable Verbose Logging
Add to your queue initialization:
```javascript
queue.on('error', (error) => console.error('Queue Error:', error));
queue.on('active', (job) => console.log(`Job ${job.id} started`));
queue.on('progress', (job, progress) => console.log(`Job ${job.id}: ${progress}%`));
```

---

## Expected Timeline

| Action | Time | Notes |
|--------|------|-------|
| User registers | 0ms | Instant response |
| Email queued | <10ms | Immediate |
| Email processor starts | <1s | Based on Redis polling |
| SMTP connection | 1-2s | Network latency |
| Email sent | 2-5s | Depends on Gmail |
| Queue job marked complete | <100ms | Job status update |

---

## Cleanup Between Tests

```bash
# Stop server
CTRL+C

# Clear Redis (careful: clears all data)
redis-cli FLUSHDB

# Restart Redis
redis-server

# Restart server
npm run dev
```

---

## Success Criteria

✓ All API endpoints return instantly
✓ Queue stats show job counts
✓ Console logs show job processing
✓ Jobs transition from waiting → active → completed
✓ Failed jobs (if any) retry automatically
✓ No crashes or unhandled errors
✓ Redis connection stable
