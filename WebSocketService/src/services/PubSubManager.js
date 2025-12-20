const redis = require('redis');

class PubSubManager {
    constructor() {
        this.publisher = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        this.subscriber = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        this.handlers = new Map();
    } 

    async connect() {
        try {
            await this.publisher.connect();
            await this.subscriber.connect();
            console.log('PubSubManager: Connected to Redis');
        } catch (error) {
            console.error('PubSubManager Connection Error:', error);
            throw error;
        }
    }

    // Subscribe to channel and handle messages
    async subscribe(channel, handler) {
        try {
            await this.subscriber.subscribe(channel, async (message) => {
                const data = JSON.parse(message);
                await handler(data);
            });
            this.handlers.set(channel, handler);
            console.log(`PubSubManager: Subscribed to channel: ${channel}`);
        } catch (error) {
            console.error(`Error subscribing to ${channel}:`, error);
            throw error;
        }
    }

    // Unsubscribe from channel
    async unsubscribe(channel) {
        try {
            await this.subscriber.unsubscribe(channel);
            this.handlers.delete(channel);
            console.log(`PubSubManager: Unsubscribed from channel: ${channel}`);
        } catch (error) {
            console.error(`Error unsubscribing from ${channel}:`, error);
            throw error;
        }
    }

    // Publish message to channel
    async publish(channel, message) {
        try {
            const data = typeof message === 'string' ? message : JSON.stringify(message);
            await this.publisher.publish(channel, data);
            console.log(`PubSubManager: Published to ${channel}`, message);
        } catch (error) {
            console.error(`Error publishing to ${channel}:`, error);
            throw error;
        }
    }

    // Disconnect from Redis
    async disconnect() {
        try {
            await this.publisher.disconnect();
            await this.subscriber.disconnect();
            console.log('PubSubManager: Disconnected from Redis');
        } catch (error) {
            console.error('Error disconnecting from Redis:', error);
            throw error;
        }
    }
}

module.exports = PubSubManager;
