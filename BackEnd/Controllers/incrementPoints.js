const UserExperience = require('../models/userExperience');
const { client } = require('../config/redis');

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