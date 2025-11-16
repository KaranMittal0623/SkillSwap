const ChatMessage = require('../models/ChatMessage');
const User = require('../models/userSchema');

// Generate conversation ID (must match WebSocket service)
const generateConversationId = (userId1, userId2) => {
    const ids = [userId1, userId2].sort();
    return `${ids[0]}_${ids[1]}`;
};

// Get all conversations for a user
const getUserConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all unique users this person has chatted with
        const conversations = await ChatMessage.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: userId },
                        { receiverId: userId }
                    ],
                    deletedAt: null
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: '$conversationId',
                    lastMessage: { $first: '$message' },
                    lastMessageTime: { $first: '$createdAt' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$receiverId', userId] },
                                        { $eq: ['$isRead', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    otherUserId: {
                        $first: {
                            $cond: [
                                { $eq: ['$senderId', userId] },
                                '$receiverId',
                                '$senderId'
                            ]
                        }
                    }
                }
            },
            {
                $sort: { lastMessageTime: -1 }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'otherUserId',
                    foreignField: '_id',
                    as: 'otherUser'
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: conversations
        });

    } catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching conversations',
            error: error.message
        });
    }
};

// Get chat history between two users
const getChatHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { targetUserId } = req.params;
        const { limit = 50, page = 1 } = req.query;

        const conversationId = generateConversationId(userId.toString(), targetUserId);
        const skip = (page - 1) * limit;

        const messages = await ChatMessage.find({
            conversationId,
            deletedAt: null
        })
            .populate('senderId', 'name email')
            .populate('receiverId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await ChatMessage.countDocuments({
            conversationId,
            deletedAt: null
        });

        res.status(200).json({
            success: true,
            data: messages.reverse(),
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error('Error getting chat history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching chat history',
            error: error.message
        });
    }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const unreadCount = await ChatMessage.countDocuments({
            receiverId: userId,
            isRead: false,
            deletedAt: null
        });

        res.status(200).json({
            success: true,
            unreadCount
        });

    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching unread count',
            error: error.message
        });
    }
};

// Mark conversation as read
const markConversationAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { targetUserId } = req.params;

        const conversationId = generateConversationId(userId.toString(), targetUserId);

        await ChatMessage.updateMany(
            {
                conversationId,
                receiverId: userId,
                isRead: false,
                deletedAt: null
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.status(200).json({
            success: true,
            message: 'Conversation marked as read'
        });

    } catch (error) {
        console.error('Error marking conversation as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking conversation as read',
            error: error.message
        });
    }
};

// Delete a message (soft delete)
const deleteMessage = async (req, res) => {
    try {
        const userId = req.user._id;
        const { messageId } = req.params;

        const message = await ChatMessage.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this message'
            });
        }

        await ChatMessage.findByIdAndUpdate(messageId, {
            deletedAt: new Date()
        });

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting message',
            error: error.message
        });
    }
};

// Delete entire conversation (soft delete)
const deleteConversation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { targetUserId } = req.params;

        const conversationId = generateConversationId(userId.toString(), targetUserId);

        await ChatMessage.updateMany(
            { conversationId },
            { deletedAt: new Date() }
        );

        res.status(200).json({
            success: true,
            message: 'Conversation deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting conversation',
            error: error.message
        });
    }
};

// Search messages in conversations
const searchMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const { query, targetUserId } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        let filter = {
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ],
            message: { $regex: query, $options: 'i' },
            deletedAt: null
        };

        if (targetUserId) {
            const conversationId = generateConversationId(userId.toString(), targetUserId);
            filter.conversationId = conversationId;
        }

        const messages = await ChatMessage.find(filter)
            .populate('senderId', 'name email')
            .populate('receiverId', 'name email')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            data: messages
        });

    } catch (error) {
        console.error('Error searching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching messages',
            error: error.message
        });
    }
};

module.exports = {
    getUserConversations,
    getChatHistory,
    getUnreadCount,
    markConversationAsRead,
    deleteMessage,
    deleteConversation,
    searchMessages
};
