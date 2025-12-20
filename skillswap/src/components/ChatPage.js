import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Box,
  Avatar,
  Chip,
  Dialog,
  DialogContent
} from '@mui/material';
import { useUser } from '../context/UserContext';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import chatApi from '../services/chatApi';
import Chat from './Chat';

const ChatPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [openChat, setOpenChat] = useState(false);
  const [directChatUser, setDirectChatUser] = useState(null);
  const [directChatLoading, setDirectChatLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // If userId is in URL params, load that user for direct chat
    if (userId) {
      const loadDirectChatUser = async () => {
        try {
          setDirectChatLoading(true);
          const response = await api.get(`/${userId}`);
          if (response.data.success) {
            setDirectChatUser(response.data.data);
            setOpenChat(true);
          }
        } catch (err) {
          console.error('Error loading user:', err);
          setError('Failed to load user. Please try again.');
        } finally {
          setDirectChatLoading(false);
        }
      };
      loadDirectChatUser();
    }

    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await chatApi.get('/conversations');
        
        if (response.data.success) {
          // Transform the data to match expected format
          const transformedConversations = response.data.data.map(conv => ({
            _id: conv._id,
            participants: conv.otherUser ? [conv.otherUser[0]] : [],
            lastMessage: conv.lastMessage,
            lastMessageTime: conv.lastMessageTime,
            unreadCount: conv.unreadCount || 0
          }));
          setConversations(transformedConversations);
        } else {
          setError(response.data.message || 'Failed to load conversations');
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError(err.message || 'Failed to load conversations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user, navigate, userId]);

  const handleOpenChat = (conversation) => {
    setSelectedConversation(conversation);
    setOpenChat(true);
  };

  const handleCloseChat = () => {
    setOpenChat(false);
    setSelectedConversation(null);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography color="error">Please login to access chat</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          💬 Messages
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Connect and chat with other learners
        </Typography>
      </Box>

      {/* Error Message */}
      {error && (
        <Card sx={{ mb: 3, backgroundColor: '#ffebee' }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : conversations.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              No conversations yet
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Start by searching for skills or connecting with other users
            </Typography>
            <Button
              variant="contained"
              color="primary"
              href="/search"
            >
              Search Skills
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {conversations.map((conversation) => {
            // Determine the other user in the conversation
            const otherUser = conversation.participants.find(
              p => p._id !== user._id
            );

            return (
              <Grid item xs={12} sm={6} md={4} key={conversation._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 4,
                    },
                    backgroundColor: conversation.unreadCount > 0 ? '#f3e5f5' : 'white',
                  }}
                  onClick={() => handleOpenChat(conversation)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* User Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          bgcolor: 'primary.main',
                          fontSize: '1.2rem',
                          mr: 2,
                        }}
                      >
                        {getInitials(otherUser?.name || 'User')}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ mb: 0 }}>
                          {otherUser?.name || 'Unknown User'}
                        </Typography>
                        {conversation.unreadCount > 0 && (
                          <Chip
                            label={`${conversation.unreadCount} unread`}
                            size="small"
                            color="primary"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Last Message Preview */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: conversation.unreadCount > 0 ? 600 : 400,
                        }}
                      >
                        {conversation.lastMessage || 'No messages yet'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {conversation.lastMessageTime
                          ? new Date(conversation.lastMessageTime).toLocaleDateString()
                          : ''}
                      </Typography>
                    </Box>
                  </CardContent>

                  {/* Action Button */}
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenChat(conversation);
                      }}
                    >
                      Open Chat
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Chat Dialog */}
      <Dialog
        open={openChat}
        onClose={handleCloseChat}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' },
        }}
      >
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {directChatLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : directChatUser ? (
            <Chat
              userId={user._id}
              targetUserId={directChatUser._id}
              targetUserName={directChatUser.name}
            />
          ) : selectedConversation ? (
            <Chat
              userId={user._id}
              targetUserId={selectedConversation.participants.find(p => p._id !== user._id)?._id}
              targetUserName={selectedConversation.participants.find(p => p._id !== user._id)?.name}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default ChatPage;
