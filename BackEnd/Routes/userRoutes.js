const express = require('express');
const router = express.Router();
const addUser = require('../Controllers/addUser');
const loginUser = require('../Controllers/loginUser');
const incrementPoints = require('../Controllers/incrementPoints');
const sendConnectionRequest = require('../Controllers/sendConnectionRequest');
const getSkills = require('../Controllers/getSkills');
const getUserExperience = require('../Controllers/getUserExperience');
const auth = require('../middleware/auth');
const User = require('../models/userSchema');
const multer = require('multer');
const path = require('path');

// Public routes
router.post('/register', addUser);
router.post('/login', loginUser);

// Protected routes (require authentication)
router.post('/increment-points', auth, incrementPoints);
router.post('/send-connection-request', auth, sendConnectionRequest);

// Get all skills (public route)
router.get('/skills', getSkills);

// Get user experience
router.get('/user-experience/:userId', auth, getUserExperience);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profile-pictures/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Profile picture upload
router.post('/upload-profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;
        
        await User.findByIdAndUpdate(req.user._id, {
            profilePicture: profilePictureUrl
        });

        res.status(200).json({
            success: true,
            message: 'Profile picture uploaded successfully',
            data: {
                profilePictureUrl
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error uploading profile picture',
            error: error.message
        });
    }
});

// Update profile
router.put('/update-profile', auth, async (req, res) => {
    try {
        const { name, email, bio } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { name, email, bio },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// Add skill
router.post('/add-skill', auth, async (req, res) => {
    try {
        const { skill, level, category } = req.body;
        
        // Validate required fields
        if (!skill || skill.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Skill name is required'
            });
        }

        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const skillData = {
            skill: skill.trim(),
            level: parseInt(level) || 1,
            dateAdded: new Date()
        };

        if (category === 'offered') {
            user.skillsOffered = user.skillsOffered || [];
            user.skillsOffered.push(skillData);
        } else if (category === 'wanted') {
            user.skillsWanted = user.skillsWanted || [];
            user.skillsWanted.push(skillData);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid category. Must be "offered" or "wanted"'
            });
        }

        await user.save();

        // Get the saved skill (MongoDB will have added the _id)
        const skillsArray = category === 'offered' ? user.skillsOffered : user.skillsWanted;
        const savedSkill = skillsArray[skillsArray.length - 1];

        res.status(200).json({
            success: true,
            message: 'Skill added successfully',
            data: {
                _id: savedSkill._id,
                skill: savedSkill.skill,
                level: savedSkill.level,
                dateAdded: savedSkill.dateAdded
            }
        });
    } catch (error) {
        console.error('Error adding skill:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding skill',
            error: error.message
        });
    }
});

// Update skill
router.put('/update-skill/:skillId', auth, async (req, res) => {
    try {
        const { skillId } = req.params;
        const { skill, level, category } = req.body;

        // Validate inputs
        if (!skill || skill.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Skill name is required'
            });
        }

        if (!category || (category !== 'offered' && category !== 'wanted')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category. Must be "offered" or "wanted"'
            });
        }
        
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let skillArray = category === 'offered' ? user.skillsOffered : user.skillsWanted;
        const skillIndex = skillArray?.findIndex(s => s._id.toString() === skillId);
        
        if (skillIndex === undefined || skillIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found'
            });
        }

        skillArray[skillIndex].skill = skill.trim();
        skillArray[skillIndex].level = parseInt(level) || 1;
        skillArray[skillIndex].dateModified = new Date();

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Skill updated successfully',
            data: {
                _id: skillArray[skillIndex]._id,
                skill: skillArray[skillIndex].skill,
                level: skillArray[skillIndex].level,
                dateModified: skillArray[skillIndex].dateModified
            }
        });
    } catch (error) {
        console.error('Error updating skill:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating skill',
            error: error.message
        });
    }
});

// Delete skill
router.delete('/delete-skill/:skillId', auth, async (req, res) => {
    try {
        const { skillId } = req.params;
        
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Try to find and remove from skillsOffered
        let skillIndex = user.skillsOffered?.findIndex(s => s._id.toString() === skillId);
        if (skillIndex !== undefined && skillIndex !== -1) {
            user.skillsOffered.splice(skillIndex, 1);
        } else {
            // Try to find and remove from skillsWanted
            skillIndex = user.skillsWanted?.findIndex(s => s._id.toString() === skillId);
            if (skillIndex !== undefined && skillIndex !== -1) {
                user.skillsWanted.splice(skillIndex, 1);
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Skill not found'
                });
            }
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Skill deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting skill:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting skill',
            error: error.message
        });
    }
});

// Get user details by ID
router.get('/:userId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('name email skills skillsOffered skillsWanted profilePicture bio');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
});

module.exports = router;