const User = require('../models/userSchema');
const UserExperience = require('../models/userExperience');
const { client } = require('../config/redis');
const { addEmailJob, addActivityLogJob } = require('../utils/queueManager');

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

        // Queue welcome email
        await addEmailJob({
            to: newUser.email,
            subject: 'Welcome to SkillSwap - Start Your Learning Journey!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Welcome to SkillSwap!</h1>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                        <h2>Hello ${newUser.name},</h2>
                        <p>Welcome to SkillSwap! We're excited to have you join our community of learners and skill sharers.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h3 style="color: #4CAF50;">Your Profile Summary:</h3>
                            <p><strong>Name:</strong> ${newUser.name}</p>
                            <p><strong>Email:</strong> ${newUser.email}</p>
                            <p><strong>Skills Offered:</strong> ${newUser.skillsOffered.length > 0 ? newUser.skillsOffered.join(', ') : 'Not specified yet'}</p>
                            <p><strong>Skills Wanted:</strong> ${newUser.skillsWanted.length > 0 ? newUser.skillsWanted.join(', ') : 'Not specified yet'}</p>
                        </div>

                        <h3 style="color: #4CAF50;">Getting Started:</h3>
                        <ol>
                            <li>Complete your profile with your skills</li>
                            <li>Browse and connect with other learners</li>
                            <li>Send connection requests to learn new skills</li>
                            <li>Earn points as you help others learn</li>
                        </ol>

                        <p style="margin-top: 20px;">If you have any questions or need assistance, feel free to reach out to our support team.</p>
                        
                        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                        
                        <p style="color: #666; font-size: 0.9em;">Best regards,<br>The SkillSwap Team</p>
                    </div>
                </div>
            `
        });

        // Log activity
        await addActivityLogJob({
            userId: newUser._id,
            action: 'user_registration',
            timestamp: new Date()
        });

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
