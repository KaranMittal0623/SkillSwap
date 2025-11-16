const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../Controllers/chatController');

// Get all conversations for a user
router.get('/conversations', auth, chatController.getUserConversations);

// Get chat history between two users
router.get('/history/:targetUserId', auth, chatController.getChatHistory);

// Get unread message count
router.get('/unread-count', auth, chatController.getUnreadCount);

// Mark conversation as read
router.put('/mark-read/:targetUserId', auth, chatController.markConversationAsRead);

// Delete a message
router.delete('/message/:messageId', auth, chatController.deleteMessage);

// Delete entire conversation
router.delete('/conversation/:targetUserId', auth, chatController.deleteConversation);

// Search messages
router.get('/search', auth, chatController.searchMessages);

module.exports = router;
