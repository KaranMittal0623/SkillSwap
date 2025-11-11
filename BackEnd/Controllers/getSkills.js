const User = require('../models/userSchema');

const getSkills = async (req, res) => {
    try {
        // Find all users and select their skills
        const users = await User.find({}, 'name email skillsOffered skillsWanted');
        
        
        const formattedSkills = users.reduce((acc, user) => {
            // Process offered skills
            const offeredSkills = (user.skillsOffered || []).map(skill => ({
                _id: `${user._id}-${skill}`,
                name: skill,
                type: 'offered',
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                }
            }));

            // Process wanted skills
            const wantedSkills = (user.skillsWanted || []).map(skill => ({
                _id: `${user._id}-${skill}`,
                name: skill,
                type: 'wanted',
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                }
            }));

            return [...acc, ...offeredSkills, ...wantedSkills];
        }, []);

        res.status(200).json({
            success: true,
            skills: formattedSkills
        });

    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching skills',
            error: error.message
        });
    }
};

module.exports = getSkills;