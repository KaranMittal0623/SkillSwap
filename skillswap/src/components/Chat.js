import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './Chat.css';

const Chat = ({ userId, targetUserId, targetUserName }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [socket, setSocket] = useState(null);
    const [conversationId, setConversationId] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const messagesRef = useRef([]);

    // Load chat history from server
    const loadChatHistory = useCallback(async (socketInstance) => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/chat/history/${targetUserId}?limit=50&page=1`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setMessages(response.data.data);
                
                // Generate conversation ID
                const genConversationId = [userId, targetUserId].sort().join('_');
                setConversationId(genConversationId);
                
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, targetUserId]);

    // Scroll to bottom
    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // Initialize WebSocket connection
    useEffect(() => {
        if (!userId || !targetUserId) {
            console.error('Missing userId or targetUserId');
            return;
        }

        const token = localStorage.getItem('token');
        
        const newSocket = io(process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:8000', {
            auth: {
                userId,
                token
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling']
        });

        // Connection events
        newSocket.on('connect', () => {
            console.log('WebSocket connected:', newSocket.id);
            setConnectionStatus('connected');
            
            // Register user
            newSocket.emit('user_join', { userId });
            
            // Start chat with target user
            newSocket.emit('start_chat', {
                userId,
                targetUserId
            });

            // Load chat history
            loadChatHistory(newSocket);
        });

        newSocket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setConnectionStatus('disconnected');
        });

        newSocket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            setConnectionStatus('error');
        });

        // Message events
        newSocket.on('new_message', (message) => {
            console.log('New message received:', message);
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        });

        newSocket.on('message_sent', (message) => {
            console.log('Message sent:', message);
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === message._id ? message : msg
                )
            );
        });

        newSocket.on('user_typing', (data) => {
            if (data.userId === targetUserId) {
                setIsTyping(true);
            }
        });

        newSocket.on('user_stop_typing', (data) => {
            if (data.userId === targetUserId) {
                setIsTyping(false);
            }
        });

        newSocket.on('chat_history', (data) => {
            console.log('Chat history received:', data);
            setConversationId(data.conversationId);
            setMessages(Array.isArray(data.messages) ? data.messages : []);
            scrollToBottom();
        });

        newSocket.on('messages_read', (data) => {
            console.log('Messages marked as read:', data);
            setMessages(prev =>
                prev.map(msg =>
                    data.messageIds?.includes(msg._id)
                        ? { ...msg, isRead: true, readAt: data.readAt }
                        : msg
                )
            );
        });

        newSocket.on('message_error', (data) => {
            console.error('Message error:', data);
            alert('Failed to send message: ' + data.error);
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.emit('end_chat', {
                    userId,
                    targetUserId
                });
                newSocket.off('connect');
                newSocket.off('disconnect');
                newSocket.off('new_message');
                newSocket.off('message_sent');
                newSocket.off('user_typing');
                newSocket.off('user_stop_typing');
                newSocket.off('chat_history');
                newSocket.off('messages_read');
                newSocket.off('message_error');
                newSocket.off('connect_error');
                newSocket.disconnect();
            }
        };
    }, [userId, targetUserId, loadChatHistory]);

    // Send message
    const handleSendMessage = (e) => {
        e.preventDefault();

        if (!inputValue.trim()) {
            return;
        }

        if (!socket || socket.disconnected) {
            alert('Not connected to chat server. Please refresh the page.');
            return;
        }

        const messageData = {
            userId,
            targetUserId,
            message: inputValue.trim(),
            messageType: 'text'
        };

        console.log('Sending message:', messageData);
        socket.emit('send_message', messageData);

        setInputValue('');
        socket.emit('user_stop_typing', {
            userId,
            targetUserId
        });
    };

    // Handle typing
    const handleTyping = (e) => {
        setInputValue(e.target.value);

        if (socket && socket.connected && typingTimeoutRef.current === null) {
            socket.emit('user_typing', {
                userId,
                targetUserId
            });

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('user_stop_typing', {
                    userId,
                    targetUserId
                });
                typingTimeoutRef.current = null;
            }, 3000);
        }
    };

    // Mark messages as read
    const markAsRead = useCallback(() => {
        if (socket && socket.connected && conversationId) {
            const unreadMessageIds = messagesRef.current
                .filter(msg => msg.receiverId === userId && !msg.isRead)
                .map(msg => msg._id);

            if (unreadMessageIds.length > 0) {
                console.log('Marking messages as read:', unreadMessageIds);
                socket.emit('mark_as_read', {
                    conversationId,
                    messageIds: unreadMessageIds
                });
            }
        }
    }, [conversationId, userId, socket]);

    // Update messages ref whenever messages change
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Mark as read when messages change
    useEffect(() => {
        const unreadMessages = messages.filter(
            msg => msg.receiverId === userId && !msg.isRead
        );
        if (unreadMessages.length > 0) {
            const timer = setTimeout(markAsRead, 500);
            return () => clearTimeout(timer);
        }
    }, [messages, userId, markAsRead]);

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2>{targetUserName}</h2>
                <p className={`status ${connectionStatus}`}>
                    {connectionStatus === 'connected' ? '🟢 Online' : connectionStatus === 'connecting' ? '🟡 Connecting...' : '🔴 Offline'}
                </p>
            </div>

            <div className="chat-messages">
                {isLoading ? (
                    <div className="loading">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="no-messages">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg._id}
                            className={`message ${
                                msg.senderId === userId ? 'sent' : 'received'
                            }`}
                        >
                            <div className="message-content">
                                <p>{msg.message}</p>
                                <span className="timestamp">
                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                                {msg.senderId === userId && (
                                    <span className="read-status">
                                        {msg.isRead ? '✓✓' : '✓'}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {isTyping && (
                    <div className="message received">
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    placeholder={connectionStatus === 'connected' ? "Type a message..." : "Reconnecting..."}
                    value={inputValue}
                    onChange={handleTyping}
                    className="chat-input"
                    disabled={!socket || socket.disconnected}
                />
                <button
                    type="submit"
                    className="send-button"
                    disabled={!socket || socket.disconnected || !inputValue.trim()}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;
