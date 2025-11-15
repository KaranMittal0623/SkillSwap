const User = require('../models/userSchema');
const { client } = require('../config/redis');

const SKILLS_CACHE_KEY = 'allSkills';
const SKILLS_CACHE_EXPIRY = 600; // 10 minutes

const getSkills = async (req, res) => {
    try {
        // Check if skills are in cache
        const cachedSkills = await client.get(SKILLS_CACHE_KEY);
        if (cachedSkills) {
            return res.status(200).json({
                success: true,
                skills: JSON.parse(cachedSkills),
                fromCache: true
            });
        }

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

        // Store in cache for 10 minutes
        await client.setEx(SKILLS_CACHE_KEY, SKILLS_CACHE_EXPIRY, JSON.stringify(formattedSkills));

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