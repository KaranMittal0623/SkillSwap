import React, { useState, useEffect } from 'react';
import { Container, TextField, Grid, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextareaAutosize, Box, Chip } from '@mui/material';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ChatIcon from '@mui/icons-material/Chat';

const SkillSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const { sendConnectionRequest } = useUser();

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Fetching skills...');
        const response = await api.get('/skills');
        console.log('Skills response:', response.data);
        setSkills(response.data.skills);
      } catch (err) {
        console.error('Error fetching skills:', err);
        setError(err.message || 'Failed to fetch skills. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  const handleConnect = (skill) => {
    setSelectedUser({
      _id: skill.user._id,
      name: skill.user.name,
      email: skill.user.email,
      skill: skill.name,
      skills: skill.user.skills || []
    });
    setShowRequestDialog(true);
  };

  const handleStartChat = (skill) => {
    // Navigate to chat with the specific user
    navigate(`/chat/${skill.user._id}`, { 
      state: { 
        otherUser: {
          _id: skill.user._id,
          name: skill.user.name
        }
      } 
    });
  };

  const handleSendRequest = async () => {
    if (!message.trim()) {
      setError('Please write a message');
      return;
    }

    try {
      const result = await sendConnectionRequest(
        selectedUser._id,
        message,
        selectedUser.skill // Now we're passing the specific skill they clicked on
      );

      if (result.success) {
        setMessage('');
        setSelectedUser(null);
      } else {
        setError(result.error || 'Failed to send request');
      }
    } catch (err) {
      console.error('Connection request error:', err);
      setError('Failed to send connection request');
    }
  };

  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="md" style={{ marginTop: '2rem' }}>
      <TextField
        fullWidth
        label="Search Skills"
        variant="outlined"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: '2rem' }}
      />

      <Grid container spacing={2}>
        {filteredSkills.map((skill) => (
          <Grid item xs={12} key={skill._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{skill.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Offered by: {skill.user.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Level: {skill.level}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 1 }}>
                  {skill.user.skills && skill.user.skills.length > 0 && (
                    <>
                      <Typography variant="caption" sx={{ width: '100%' }} color="textSecondary">
                        Their Skills:
                      </Typography>
                      {skill.user.skills.slice(0, 3).map((s, idx) => (
                        <Chip key={idx} label={s} size="small" variant="outlined" />
                      ))}
                    </>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small"
                    onClick={() => handleConnect(skill)}
                    sx={{ flex: 1 }}
                  >
                    Request
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="small"
                    startIcon={<ChatIcon />}
                    onClick={() => handleStartChat(skill)}
                    sx={{ flex: 1 }}
                  >
                    Chat
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Connection Request Dialog */}
      <Dialog open={showRequestDialog} onClose={() => { setShowRequestDialog(false); setSelectedUser(null); }}>
        <DialogTitle>Request to Learn {selectedUser?.skill}</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom color="primary">
            Connecting with {selectedUser?.name}
          </Typography>
          {selectedUser?.skills && selectedUser.skills.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Their Skills:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedUser.skills.map((skill, idx) => (
                  <Chip key={idx} label={skill} size="small" />
                ))}
              </Box>
            </Box>
          )}
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Write a message explaining why you'd like to learn {selectedUser?.skill} and what you hope to achieve.
            This will help {selectedUser?.name} understand your learning goals.
          </Typography>
          <TextareaAutosize
            minRows={4}
            placeholder="Example: Hi! I'm really interested in learning this skill from you. I have some basic knowledge and would love to improve..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '16px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontFamily: 'inherit',
              fontSize: '14px'
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowRequestDialog(false); setSelectedUser(null); }}>Cancel</Button>
          <Button onClick={handleSendRequest} color="primary" variant="contained">
            Send Request
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SkillSearch;