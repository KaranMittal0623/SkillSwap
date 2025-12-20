const {createClient} = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
console.log('Redis URL:', redisUrl);

const client = createClient({
    url: redisUrl,
    socket: {
        reconnectStrategy: (retries) => {
            const delay = Math.min(retries * 50, 500);
            return delay;
        },
        connectTimeout: 10000
    }
});

client.on('error', (err) => {
    console.error('✗ Redis Client Error:', err.message);
    console.error('Redis connection details - URL:', redisUrl);
});

client.on('connect', () => {
    console.log('✓ Redis client connected');
});

client.on('reconnecting', () => {
    console.log('⟳ Redis client reconnecting...');
});

async function connectRedis() {
    try {
        if (!client.isOpen) {
            console.log('Attempting to connect to Redis...');
            await client.connect();
            console.log('✓ Connected to Redis successfully');
        } else {
            console.log('✓ Redis client already connected');
        }
    } catch (err) {
        console.error('✗ Failed to connect to Redis:', err.message);
        console.warn('⚠ Continuing without Redis caching...');
        // Don't throw error - allow app to continue without redis
    }
}

module.exports = {
    client,
    connectRedis
};