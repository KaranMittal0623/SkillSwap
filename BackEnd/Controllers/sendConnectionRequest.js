const nodemailer = require('nodemailer');
const User = require('../models/userSchema');

// Configure nodemailer
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASS in .env file');
}

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

const sendConnectionRequest = async (req, res) => {
    try {
        const { 
            targetUserId,    
            message,         
            skillInterested  
        } = req.body;

        
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        
        const requestingUser = await User.findById(req.user._id);

        
        const targetUserEmail = {
            from: `SkillSwap Admin <${process.env.EMAIL_USER}>`,
            to: targetUser.email,
            subject: 'New SkillSwap Connection Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">SkillSwap Connection Request</h1>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                        <h2>Hello ${targetUser.name},</h2>
                        <p>You have received a new connection request on SkillSwap!</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h3 style="color: #4CAF50;">Request Details:</h3>
                            <p><strong>From:</strong> ${requestingUser.name}</p>
                            <p><strong>Interested In Learning:</strong> ${skillInterested}</p>
                            <p><strong>Message:</strong></p>
                            <p style="font-style: italic; padding: 10px; background-color: white; border-left: 3px solid #4CAF50;">${message}</p>
                        </div>

                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
                            <h3 style="color: #4CAF50;">Requester's Contact Information:</h3>
                            <p><strong>Name:</strong> ${requestingUser.name}</p>
                            <p><strong>Email:</strong> ${requestingUser.email}</p>
                        </div>

                        <p style="margin-top: 20px;">You can reply to this email to connect with ${requestingUser.name}.</p>
                        
                        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                        
                        <p style="color: #666; font-size: 0.9em;">Best regards,<br>The SkillSwap Team</p>
                    </div>
                </div>
            `
        };

        
        const requestingUserEmail = {
            from: `SkillSwap Admin <${process.env.EMAIL_USER}>`,
            to: requestingUser.email,
            subject: 'Your SkillSwap Connection Request - Confirmation',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">SkillSwap Request Confirmation</h1>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                        <h2>Hello ${requestingUser.name},</h2>
                        <p>We've sent your connection request to learn <strong>${skillInterested}</strong> to ${targetUser.name}.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h3 style="color: #4CAF50;">Your Request Details:</h3>
                            <p><strong>To:</strong> ${targetUser.name}</p>
                            <p><strong>Your Message:</strong></p>
                            <p style="font-style: italic; padding: 10px; background-color: white; border-left: 3px solid #4CAF50;">${message}</p>
                        </div>

                        <p>We'll notify you when ${targetUser.name} responds to your request.</p>
                        
                        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                        
                        <p style="color: #666; font-size: 0.9em;">Best regards,<br>The SkillSwap Team</p>
                    </div>
                </div>
            `
        };

        
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error('Email configuration is missing. Please check your environment variables.');
        }

        
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

        
        res.status(200).json({
            success: true,
            message: 'Connection request sent successfully'
        });

        
        try {
            const [targetInfo, requesterInfo] = await Promise.all([
                transporter.sendMail(targetUserEmail),
                transporter.sendMail(requestingUserEmail)
            ]);
            
            console.log('Emails sent successfully:', {
                targetEmail: targetInfo.response,
                requesterEmail: requesterInfo.response
            });
        } catch (emailError) {
            console.error('Email sending error:', emailError);
        }

    } catch (error) {
        console.error('Request processing error:', error);
        let errorMessage = 'Error processing connection request';
        
        if (error.message.includes('configuration is missing')) {
            errorMessage = 'Email service not configured properly';
        } else if (error.code === 'EAUTH') {
            errorMessage = 'Email authentication failed. Please check credentials.';
        } else if (error.code === 'ESOCKET') {
            errorMessage = 'Failed to connect to email server';
        }
        
        // Only send error response if we haven't sent success response
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: errorMessage,
                error: error.message
            });
        }
    }
};

module.exports = sendConnectionRequest;