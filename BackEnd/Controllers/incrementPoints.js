const UserExperience = require('../models/userExperience');
const { client } = require('../config/redis');
const { addPointsUpdateJob, addEmailJob, addActivityLogJob } = require('../utils/queueManager');
const User = require('../models/userSchema');

const getUserExperienceCacheKey = (userId) => `userExp:${userId}`;

const incrementPoints = async (req, res) => {
    try {
        const { userId, skillName } = req.body;

        // Find user experience document
        const userExp = await UserExperience.findOne({ user: userId });

        if (!userExp) {
            return res.status(404).json({
                success: false,
                message: 'User experience record not found'
            });
        }

        // Add 1 point using the method we created in the model
        await userExp.addPoints(1, skillName, false);

        // Invalidate the cache for this user's experience
        await client.del(getUserExperienceCacheKey(userId));

        // Queue points update notification
        await addPointsUpdateJob({
            userId,
            skillName,
            pointsAdded: 1,
            totalPoints: userExp.learningPoints,
            timestamp: new Date()
        });

        // Get user for email
        const user = await User.findById(userId);
        
        // Queue milestone notification if user leveled up
        if (userExp.learningPoints % 100 === 0) {
            await addEmailJob({
                to: user.email,
                subject: `Milestone Reached! You\'ve Earned 100 Points on SkillSwap!`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0;">🎉 Milestone Achievement!</h1>
                        </div>
                        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                            <h2>Congratulations ${user.name}!</h2>
                            <p>You've reached an amazing milestone on SkillSwap!</p>
                            
                            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                                <h3 style="color: #ff9800; margin: 0 0 10px 0;">100 Learning Points Earned!</h3>
                                <p style="margin: 0; font-size: 1.2em; font-weight: bold;">Level: ${userExp.level}</p>
                            </div>

                            <p>Your dedication to learning and helping others is truly remarkable. Keep up the great work!</p>
                            
                            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                            
                            <p style="color: #666; font-size: 0.9em;">Best regards,<br>The SkillSwap Team</p>
                        </div>
                    </div>
                `
            });
        }

        // Log activity
        await addActivityLogJob({
            userId,
            action: 'points_earned',
            skillName,
            pointsAdded: 1,
            timestamp: new Date()
        });

        res.status(200).json({
            success: true,
            message: 'Point added successfully',
            currentPoints: userExp.learningPoints,
            level: userExp.level
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding point',
            error: error.message
        });
    }
};

module.exports = incrementPoints;