const User = require('../models/userSchema');
const UserExperience = require('../models/userExperience');
const { client } = require('../config/redis');

const addUser = async (req, res) => {
    try {
        const { name, email, password, skillsOffered, skillsWanted } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email' 
            });
        }

        // Create new user
        const newUser = new User({
            name,
            email,
            password,
            skillsOffered: skillsOffered || [],
            skillsWanted: skillsWanted || []
        });

        // Save the user
        await newUser.save();

        // Create user experience record
        const userExperience = new UserExperience({
            user: newUser._id,
            learningPoints: 0 
        });

        await userExperience.save();

        // Invalidate skills cache since new user was added
        await client.del('allSkills');

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: newUser
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

module.exports = addUser;
