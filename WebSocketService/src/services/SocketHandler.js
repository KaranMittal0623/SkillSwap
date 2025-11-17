const ChatMessage = require('../models/ChatMessage');

class SocketHandler {
    constructor(io, pubSubManager) {
        this.io = io;
        this.pubSubManager = pubSubManager;
        this.userSockets = new Map(); // Map to track userId -> socketId
        this.activeChats = new Map(); // Map to track active conversations
    }

    // Initialize socket handlers
    initialize() {
        this.io.on('connection', (socket) => {
            console.log(`User connected: ${socket.id}`);

            // User joins
            socket.on('user_join', (userId) => {
                this.userSockets.set(userId, socket.id);
                socket.userId = userId;
                console.log(`User ${userId} joined with socket ${socket.id}`);

                // Notify other services about user online status
                this.pubSubManager.publish('user_status', {
                    type: 'user_online',
                    userId,
                    socketId: socket.id,
                    timestamp: new Date()
                });
            });

            // Start chat session
            socket.on('start_chat', async (data) => {
                const { userId, targetUserId, roomId } = data;
                const conversationId = roomId || this.generateConversationId(userId, targetUserId);

                // Store active chat
                this.activeChats.set(conversationId, {
                    participants: [userId, targetUserId],
                    startedAt: new Date()
                });

                // Join conversation room
                socket.join(conversationId);

                console.log(`Chat started: ${userId} <-> ${targetUserId}, Room: ${conversationId}`);

                // Subscribe to chat messages from other services
                await this.pubSubManager.subscribe(
                    `chat:${conversationId}`,
                    async (message) => {
                        // Broadcast to all sockets in this conversation
                        this.io.to(conversationId).emit('new_message', message);

                        // Mark as read if receiver is online
                        if (message.receiverId && this.userSockets.has(message.receiverId)) {
                            await this.markMessageAsRead(message._id);
                        }
                    }
                );

                // Notify receiver that chat is active
                if (this.userSockets.has(targetUserId)) {
                    this.io.to(this.userSockets.get(targetUserId)).emit('chat_started', {
                        conversationId,
                        initiatorId: userId
                    });
                }
            });

            // Join room handler
            socket.on('join_room', (data) => {
                const { roomId, userId } = data;
                socket.join(roomId);
                console.log(`User ${userId} joined room ${roomId}`);
                
                // Notify others in the room that user joined
                socket.to(roomId).emit('user_joined_room', {
                    userId,
                    roomId,
                    timestamp: new Date()
                });
            });

            // Send message
            socket.on('send_message', async (data) => {
                try {
                    const { userId, targetUserId, message } = data;
                    const conversationId = this.generateConversationId(userId, targetUserId);

                    // Save message to database
                    const newMessage = new ChatMessage({
                        conversationId,
                        senderId: userId,
                        receiverId: targetUserId,
                        message,
                        messageType: 'text'
                    });

                    await newMessage.save();

                    // Publish to Redis pub/sub
                    await this.pubSubManager.publish(`chat:${conversationId}`, {
                        _id: newMessage._id,
                        conversationId,
                        senderId: userId,
                        receiverId: targetUserId,
                        message,
                        messageType: 'text',
                        isRead: false,
                        createdAt: newMessage.createdAt
                    });

                    // Emit to room - both users will receive it
                    this.io.to(conversationId).emit('new_message', {
                        _id: newMessage._id,
                        conversationId,
                        senderId: userId,
                        receiverId: targetUserId,
                        message,
                        messageType: 'text',
                        isRead: false,
                        createdAt: newMessage.createdAt
                    });

                    console.log(`Message sent in room ${conversationId} from ${userId} to ${targetUserId}`);

                } catch (error) {
                    console.error('Error sending message:', error);
                    socket.emit('message_error', {
                        error: 'Failed to send message'
                    });
                }
            });

            // Typing indicator
            socket.on('user_typing', (data) => {
                const { userId, targetUserId } = data;
                const conversationId = this.generateConversationId(userId, targetUserId);

                this.io.to(conversationId).emit('user_typing', {
                    userId,
                    conversationId
                });
            });

            // Stop typing
            socket.on('user_stop_typing', (data) => {
                const { userId, targetUserId } = data;
                const conversationId = this.generateConversationId(userId, targetUserId);

                this.io.to(conversationId).emit('user_stop_typing', {
                    userId,
                    conversationId
                });
            });

            // Load chat history
            socket.on('load_chat_history', async (data) => {
                try {
                    const { userId, targetUserId, limit = 50 } = data;
                    const conversationId = this.generateConversationId(userId, targetUserId);

                    const messages = await ChatMessage.find({
                        conversationId,
                        deletedAt: null
                    })
                        .sort({ createdAt: -1 })
                        .limit(limit)
                        .select('_id conversationId senderId receiverId message messageType createdAt isRead');

                    socket.emit('chat_history', {
                        conversationId,
                        messages: messages.reverse()
                    });

                    console.log(`Loaded ${messages.length} messages for ${conversationId}`);

                } catch (error) {
                    console.error('Error loading chat history:', error);
                    socket.emit('history_error', {
                        error: 'Failed to load chat history'
                    });
                }
            });

            // Mark messages as read
            socket.on('mark_as_read', async (data) => {
                try {
                    const { conversationId, messageIds } = data;

                    await ChatMessage.updateMany(
                        { _id: { $in: messageIds } },
                        {
                            isRead: true,
                            readAt: new Date()
                        }
                    );

                    // Publish read status
                    await this.pubSubManager.publish(`chat:${conversationId}:read`, {
                        conversationId,
                        messageIds,
                        readAt: new Date()
                    });

                    this.io.to(conversationId).emit('messages_read', {
                        messageIds,
                        readAt: new Date()
                    });

                } catch (error) {
                    console.error('Error marking messages as read:', error);
                }
            });

            // End chat session
            socket.on('end_chat', (data) => {
                const { userId, targetUserId } = data;
                const conversationId = this.generateConversationId(userId, targetUserId);

                this.io.to(conversationId).emit('chat_ended', {
                    conversationId,
                    userId
                });

                socket.leave(conversationId);
                this.activeChats.delete(conversationId);

                // Unsubscribe from channel
                this.pubSubManager.unsubscribe(`chat:${conversationId}`).catch(console.error);

                console.log(`Chat ended: ${conversationId}`);
            });

            // Disconnect
            socket.on('disconnect', () => {
                const userId = socket.userId;
                if (userId) {
                    this.userSockets.delete(userId);

                    // Notify other services about user offline status
                    this.pubSubManager.publish('user_status', {
                        type: 'user_offline',
                        userId,
                        timestamp: new Date()
                    });

                    console.log(`User ${userId} disconnected`);
                }
            });
        });
    }

    // Generate conversation ID (consistent for both directions)
    generateConversationId(userId1, userId2) {
        const ids = [userId1, userId2].sort();
        return `${ids[0]}_${ids[1]}`;
    }

    // Mark single message as read
    async markMessageAsRead(messageId) {
        try {
            await ChatMessage.findByIdAndUpdate(
                messageId,
                {
                    isRead: true,
                    readAt: new Date()
                }
            );
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    }

    // Get active users
    getActiveUsers() {
        return Array.from(this.userSockets.keys());
    }

    // Get active conversations
    getActiveConversations() {
        return Array.from(this.activeChats.entries()).map(([id, data]) => ({
            conversationId: id,
            ...data
        }));
    }
}

module.exports = SocketHandler;
