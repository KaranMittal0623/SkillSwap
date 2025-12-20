const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 5001;
const userRoutes = require('./Routes/userRoutes');
const chatRoutes = require('./Routes/chatRoutes');
const {connectRedis} = require('./config/redis');

// Queue imports
const { setupQueueHandlers, emailQueue, notificationQueue, pointsQueue, activityQueue, closeQueues } = require('./utils/queueManager');
const { setupEmailProcessor } = require('./utils/emailProcessor');
const { setupActivityProcessor, setupPointsProcessor, setupNotificationProcessor } = require('./utils/jobProcessors');

// Connect to Redis
connectRedis();

// Initialize queues and processors
setupQueueHandlers();
setupEmailProcessor();
setupActivityProcessor();
setupPointsProcessor();
setupNotificationProcessor();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        process.env.CLIENT_URL || 'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));



// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

app.get('/',(req,res)=>{
    res.json({
        message: 'SkillSwap API is running',
        version: '1.0.0',
        status: 'healthy'
    });
})

// Diagnostic endpoint
app.get('/api/health', async (req, res) => {
    try {
        const mongoConnected = require('mongoose').connection.readyState === 1;
        const redisConnected = require('./config/redis').client.isOpen;
        
        res.status(200).json({
            success: true,
            server: 'running',
            database: mongoConnected ? 'connected' : 'disconnected',
            redis: redisConnected ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Health check failed',
            error: error.message
        });
    }
});

const connectDB = require('./config/dataBase');
connectDB();

// Queue monitoring endpoint
app.get('/api/queue-stats', async (req, res) => {
    try {
        const emailStats = await emailQueue.getJobCounts();
        const notificationStats = await notificationQueue.getJobCounts();
        const pointsStats = await pointsQueue.getJobCounts();
        const activityStats = await activityQueue.getJobCounts();

        res.status(200).json({
            success: true,
            queues: {
                email: emailStats,
                notifications: notificationStats,
                points: pointsStats,
                activity: activityStats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching queue stats',
            error: error.message
        });
    }
});

const server = app.listen(PORT, (req, res)=>{
    console.log(`Server is running on port ${PORT}`);
    console.log('Message queues initialized and ready');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        console.log('HTTP server closed');
        await closeQueues();
        console.log('All queues closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(async () => {
        console.log('HTTP server closed');
        await closeQueues();
        console.log('All queues closed');
        process.exit(0);
    });
});