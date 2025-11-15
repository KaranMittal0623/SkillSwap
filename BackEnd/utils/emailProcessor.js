const nodemailer = require('nodemailer');
const { emailQueue } = require('./queueManager');

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false 
    }
});

// Email job processor
const processEmailJob = async (job) => {
    try {
        const { to, subject, html } = job.data;

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASS in .env file');
        }

        // Verify SMTP connection
        await new Promise((resolve, reject) => {
            transporter.verify(function (error, success) {
                if (error) {
                    console.error('SMTP connection error:', error);
                    reject(new Error('Failed to connect to email server'));
                } else {
                    resolve(success);
                }
            });
        });

        // Send email
        const info = await transporter.sendMail({
            from: `SkillSwap Admin <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });

        console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error(`Email job ${job.id} error:`, error);
        throw error;
    }
};

// Setup email queue processor
const setupEmailProcessor = () => {
    emailQueue.process(async (job) => {
        return processEmailJob(job);
    });

    console.log('Email queue processor started');
};

module.exports = {
    transporter,
    processEmailJob,
    setupEmailProcessor
};
