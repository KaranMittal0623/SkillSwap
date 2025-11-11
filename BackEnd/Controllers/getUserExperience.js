const UserExperience = require('../models/userExperience');

const getUserExperience = async (req, res) => {
    try {
        const { userId } = req.params;

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
            return res.status(200).json({
                success: true,
                data: newUserExp
            });
        }

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