require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

// Import services
const PubSubManager = require('./src/services/PubSubManager');
const SocketHandler = require('./src/services/SocketHandler');

// App setup
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
async function connectDB() {
    try {
        const mongoUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/skillswap';
        await mongoose.connect(mongoUrl);
        console.log('WebSocket Service: Connected to MongoDB');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
}

// Initialize services
let pubSubManager;
let socketHandler;

async function initializeServices() {
    try {
        // Connect to database
        await connectDB();

        // Initialize PubSub Manager
        pubSubManager = new PubSubManager();
        await pubSubManager.connect();

        // Initialize Socket Handler
        socketHandler = new SocketHandler(io, pubSubManager);
        socketHandler.initialize();

        // Subscribe to main server events
        await pubSubManager.subscribe('incoming_message', async (message) => {
            console.log('Received message from main server:', message);
            // Forward to appropriate user
            const { targetUserId, conversationId } = message;
            if (socketHandler.userSockets.has(targetUserId)) {
                io.to(socketHandler.userSockets.get(targetUserId)).emit('incoming_message', message);
            }
        });

        // Subscribe to user status updates
        await pubSubManager.subscribe('user_status', (data) => {
            console.log('User status update:', data);
            io.emit('user_status_change', data);
        });

        console.log('All services initialized successfully');
    } catch (error) {
        console.error('Service initialization error:', error);
        process.exit(1);
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        service: 'websocket-service',
        status: 'running',
        timestamp: new Date()
    });
});

// Stats endpoint
app.get('/stats', (req, res) => {
    if (!socketHandler) {
        return res.status(503).json({ error: 'Service not initialized' });
    }

    res.status(200).json({
        success: true,
        activeUsers: socketHandler.getActiveUsers().length,
        activeConversations: socketHandler.getActiveConversations().length,
        users: socketHandler.getActiveUsers(),
        conversations: socketHandler.getActiveConversations()
    });
});

// Start server
const PORT = process.env.WEBSOCKET_PORT || 8000;

async function start() {
    try {
        await initializeServices();

        server.listen(PORT, () => {
            console.log(`WebSocket Service running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

async function shutdown() {
    console.log('Gracefully shutting down WebSocket service...');
    try {
        if (pubSubManager) {
            await pubSubManager.disconnect();
        }
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
}

// Start the service
start();

module.exports = { app, server, io, socketHandler, pubSubManager };
