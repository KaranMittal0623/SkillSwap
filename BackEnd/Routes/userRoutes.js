const express = require('express');
const router = express.Router();
const addUser = require('../Controllers/addUser');
const loginUser = require('../Controllers/loginUser');
const incrementPoints = require('../Controllers/incrementPoints');
const sendConnectionRequest = require('../Controllers/sendConnectionRequest');
const getSkills = require('../Controllers/getSkills');
const getUserExperience = require('../Controllers/getUserExperience');
const auth = require('../middleware/auth');

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

module.exports = router;