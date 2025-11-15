# Redis Caching Implementation Guide

## Overview
Redis caching has been implemented in the SkillSwap backend to improve performance by reducing database queries.

## What is Being Cached?

### 1. **All Skills** (getSkills endpoint)
- **Cache Key**: `allSkills`
- **Duration**: 10 minutes (600 seconds)
- **Data**: List of all users' offered and wanted skills
- **Invalidated When**: New user registers (skills list changes)

### 2. **User Experience Data** (getUserExperience endpoint)
- **Cache Key**: `userExp:{userId}`
- **Duration**: 5 minutes (300 seconds)
- **Data**: User's points, level, skills learned, teaching history
- **Invalidated When**: Points are incremented for that user

## How It Works

### Cache Hit (Data from Redis)
```
User Request → Check Redis Cache → Found → Return Cached Data (fast ✓)
```

### Cache Miss (Data from Database)
```
User Request → Check Redis Cache → Not Found → Query MongoDB → Store in Redis → Return Data
```

## Files Modified

1. **Controllers/getSkills.js**
   - Checks cache before querying database
   - Stores result in cache for 10 minutes

2. **Controllers/getUserExperience.js**
   - Checks cache before querying database
   - Stores result in cache for 5 minutes

3. **Controllers/addUser.js**
   - Invalidates skills cache when new user is added

4. **Controllers/incrementPoints.js**
   - Invalidates user experience cache when points are updated

## Utility File

**utils/cacheManager.js**
- Provides reusable cache functions: `getCache()`, `setCache()`, `deleteCache()`
- Stores cache expiry times and key generators
- Easy to use for future caching needs

## Usage Example

```javascript
const { getCache, setCache, deleteCache, getCacheKeys, CACHE_EXPIRY } = require('../utils/cacheManager');

// Get from cache or database
const cached = await getCache(getCacheKeys.skills());
if (cached) {
    return res.json(cached);
}

// Fetch from database
const data = await User.find({});

// Store in cache
await setCache(getCacheKeys.skills(), data, CACHE_EXPIRY.SKILLS);

// Delete cache when data changes
await deleteCache(getCacheKeys.skills());
```

## Performance Benefits

- **Reduced Database Load**: Frequently accessed data is served from memory
- **Faster Response Times**: Redis is much faster than database queries
- **Lower Latency**: Reduced round trips to database
- **Scalability**: Better handling of multiple concurrent requests

## Cache Expiry Strategy

- **Skills**: 10 minutes (doesn't change frequently)
- **User Experience**: 5 minutes (updated with points)
- User data is still read from database when needed

## Testing

To test if caching is working:

1. First request to `/api/users/skills` → Slower (database query + cache store)
2. Second request (within 10 minutes) → Faster (served from cache)
3. User registration → Skills cache invalidated
4. Next request to `/api/users/skills` → Slower again (new data fetched)

## Redis Requirements

Make sure Redis is running on your system:
- Local: `redis-cli` in terminal
- URL: Configured via `REDIS_URL` env variable (default: `redis://localhost:6379`)

## Future Enhancements

- Add more data to cache (user profiles, connection requests)
- Implement cache warming on server startup
- Add cache statistics/monitoring
- Use cache versioning for better invalidation
