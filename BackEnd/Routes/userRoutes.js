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

// Get user details by ID
router.get('/:userId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('name email skills');
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