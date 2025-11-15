const Queue = require('bull');
const redis = require('redis');

console.log('Initializing queues...');

// Create queues
const emailQueue = new Queue('email', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    },
    defaultJobOptions: {
        removeOnComplete: true
    }
});

const notificationQueue = new Queue('notifications', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    },
    defaultJobOptions: {
        removeOnComplete: true
    }
});

const pointsQueue = new Queue('points-update', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    },
    defaultJobOptions: {
        removeOnComplete: true
    }
});

const activityQueue = new Queue('user-activity', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    },
    defaultJobOptions: {
        removeOnComplete: true
    }
});

// Queue error handlers
emailQueue.on('error', (error) => {
    console.error('Email Queue Error:', error);
});

notificationQueue.on('error', (error) => {
    console.error('Notification Queue Error:', error);
});

pointsQueue.on('error', (error) => {
    console.error('Points Queue Error:', error);
});

activityQueue.on('error', (error) => {
    console.error('Activity Queue Error:', error);
});

// Queue event handlers
const setupQueueHandlers = () => {
    // Email Queue Events
    emailQueue.on('completed', (job) => {
        console.log(`Email job ${job.id} completed successfully`);
    });

    emailQueue.on('failed', (job, err) => {
        console.error(`Email job ${job.id} failed: ${err.message}`);
    });

    // Notification Queue Events
    notificationQueue.on('completed', (job) => {
        console.log(`Notification job ${job.id} completed successfully`);
    });

    notificationQueue.on('failed', (job, err) => {
        console.error(`Notification job ${job.id} failed: ${err.message}`);
    });

    // Points Queue Events
    pointsQueue.on('completed', (job) => {
        console.log(`Points update job ${job.id} completed successfully`);
    });

    pointsQueue.on('failed', (job, err) => {
        console.error(`Points update job ${job.id} failed: ${err.message}`);
    });

    // Activity Queue Events
    activityQueue.on('completed', (job) => {
        console.log(`Activity logging job ${job.id} completed successfully`);
    });

    activityQueue.on('failed', (job, err) => {
        console.error(`Activity logging job ${job.id} failed: ${err.message}`);
    });
};

// Queue functions to add jobs
const addEmailJob = async (emailData) => {
    try {
        const job = await emailQueue.add(emailData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            },
            removeOnComplete: true
        });
        console.log(`Email job ${job.id} added to queue`);
        return job;
    } catch (error) {
        console.error('Error adding email job:', error);
        throw error;
    }
};

const addNotificationJob = async (notificationData) => {
    try {
        const job = await notificationQueue.add(notificationData, {
            attempts: 2,
            backoff: {
                type: 'fixed',
                delay: 1000
            },
            removeOnComplete: true
        });
        console.log(`Notification job ${job.id} added to queue`);
        return job;
    } catch (error) {
        console.error('Error adding notification job:', error);
        throw error;
    }
};

const addPointsUpdateJob = async (pointsData) => {
    try {
        const job = await pointsQueue.add(pointsData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            },
            removeOnComplete: true
        });
        console.log(`Points update job ${job.id} added to queue`);
        return job;
    } catch (error) {
        console.error('Error adding points update job:', error);
        throw error;
    }
};

const addActivityLogJob = async (activityData) => {
    try {
        const job = await activityQueue.add(activityData, {
            attempts: 2,
            backoff: {
                type: 'fixed',
                delay: 500
            },
            removeOnComplete: true
        });
        console.log(`Activity log job ${job.id} added to queue`);
        return job;
    } catch (error) {
        console.error('Error adding activity log job:', error);
        throw error;
    }
};

// Clean up queues
const closeQueues = async () => {
    await emailQueue.close();
    await notificationQueue.close();
    await pointsQueue.close();
    await activityQueue.close();
};

module.exports = {
    emailQueue,
    notificationQueue,
    pointsQueue,
    activityQueue,
    setupQueueHandlers,
    addEmailJob,
    addNotificationJob,
    addPointsUpdateJob,
    addActivityLogJob,
    closeQueues
};
