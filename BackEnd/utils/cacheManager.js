const { client } = require('../config/redis');

// Cache expiry times (in seconds)
const CACHE_EXPIRY = {
    SKILLS: 600,        // 10 minutes
    USER_EXP: 300,      // 5 minutes
    USER_DATA: 900      // 15 minutes
};

// Cache key generators
const getCacheKeys = {
    skills: () => 'allSkills',
    userExperience: (userId) => `userExp:${userId}`,
    userData: (userId) => `user:${userId}`
};

// Set cache
const setCache = async (key, value, expiry = 600) => {
    try {
        await client.setEx(key, expiry, JSON.stringify(value));
    } catch (error) {
        console.error('Error setting cache:', error);
    }
};

// Get cache
const getCache = async (key) => {
    try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error getting cache:', error);
        return null;
    }
};

// Delete cache
const deleteCache = async (key) => {
    try {
        await client.del(key);
    } catch (error) {
        console.error('Error deleting cache:', error);
    }
};

// Delete multiple caches
const deleteCacheByPattern = async (pattern) => {
    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(keys);
        }
    } catch (error) {
        console.error('Error deleting cache by pattern:', error);
    }
};

module.exports = {
    CACHE_EXPIRY,
    getCacheKeys,
    setCache,
    getCache,
    deleteCache,
    deleteCacheByPattern
};
