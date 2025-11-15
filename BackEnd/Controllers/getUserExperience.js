const UserExperience = require('../models/userExperience');
const { client } = require('../config/redis');

const USER_EXP_CACHE_EXPIRY = 300; // 5 minutes

const getUserExperienceCacheKey = (userId) => `userExp:${userId}`;

const getUserExperience = async (req, res) => {
    try {
        const { userId } = req.params;
        const cacheKey = getUserExperienceCacheKey(userId);

        // Check if user experience is in cache
        const cachedData = await client.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                data: JSON.parse(cachedData),
                fromCache: true
            });
        }

        const userExp = await UserExperience.findOne({ user: userId })
            .populate('user', 'name email skills');

        if (!userExp) {
            // If no experience record exists, create one
            const newUserExp = new UserExperience({
                user: userId,
                learningPoints: 0,
                level: 1,
                totalPointsEarned: 0,
                skillsLearned: [],
                teachingHistory: []
            });
            await newUserExp.save();
            
            // Cache the new record
            await client.setEx(cacheKey, USER_EXP_CACHE_EXPIRY, JSON.stringify(newUserExp));
            
            return res.status(200).json({
                success: true,
                data: newUserExp
            });
        }

        // Cache the user experience data
        await client.setEx(cacheKey, USER_EXP_CACHE_EXPIRY, JSON.stringify(userExp));

        res.status(200).json({
            success: true,
            data: userExp
        });

    } catch (error) {
        console.error('Error fetching user experience:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user experience',
            error: error.message
        });
    }
};

module.exports = getUserExperience;