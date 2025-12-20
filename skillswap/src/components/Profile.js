import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  LinearProgress, 
  Avatar,
  Box,
  Divider,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Fab,
  Badge,
  Paper,
  Rating,
  Slider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PhotoCamera as PhotoCameraIcon,
  School as SchoolIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const Profile = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [userExp, setUserExp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState(null);
  
  // Dialog states
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [editSkillDialogOpen, setEditSkillDialogOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  
  // Form states
  const [newSkill, setNewSkill] = useState({ name: '', level: 1, category: 'offered' });
  const [editingSkill, setEditingSkill] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', bio: '' });
  
  // Skills state
  const [skillsOffered, setSkillsOffered] = useState([]);
  const [skillsWanted, setSkillsWanted] = useState([]);

  const updateUserData = (updater) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      const updatedUser = typeof updater === 'function' 
        ? updater(prevUser) 
        : { ...prevUser, ...updater };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Initialize form data
    setProfileForm({
      name: user.name || '',
      email: user.email || '',
      bio: user.bio || ''
    });

    // Initialize skills
    setSkillsOffered(user.skillsOffered || []);
    setSkillsWanted(user.skillsWanted || []);

    const fetchUserExperience = async () => {
      try {
        const response = await api.get(`/user-experience/${user._id}`);
        setUserExp(response.data.data);
      } catch (error) {
        console.error('Error fetching user experience:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserExperience();
  }, [user, navigate]);

  // Calculate user level based on accepted teaching requests
  const calculateLevel = () => {
    const acceptedRequests = userExp?.acceptedTeachingRequests || 0;
    return Math.floor(acceptedRequests / 5) + 1; // Level up every 5 accepted requests
  };

  // Handle profile picture upload
  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Show preview immediately
      const previewUrl = URL.createObjectURL(file);
      setProfilePicture(previewUrl);
      
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      try {
        const response = await api.post('/upload-profile-picture', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data.success) {
          // Update with server URL
          const serverUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/${response.data.data.profilePicture}`;
          setProfilePicture(serverUrl);
          
          // Update user context
          updateUserData(prev => ({
            ...prev,
            profilePicture: response.data.data.profilePicture
          }));
          
          toast.success('Profile picture updated successfully!');
          
          // Clean up preview URL
          URL.revokeObjectURL(previewUrl);
        }
      } catch (error) {
        console.error('Profile picture upload error:', error);
        toast.error('Failed to upload profile picture');
        // Reset to original on error
        setProfilePicture(user.profilePicture ? `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/${user.profilePicture}` : null);
      }
    }
  };

  // Handle skill operations
  const handleAddSkill = async () => {
    try {
      const skillData = {
        skill: newSkill.name,
        level: newSkill.level,
        category: newSkill.category
      };

      const response = await api.post('/add-skill', skillData);
      
      if (response.data.success) {
        const savedSkill = { ...response.data.data, category: newSkill.category };
        if (newSkill.category === 'offered') {
          const updatedSkills = [...skillsOffered, savedSkill];
          setSkillsOffered(updatedSkills);
          updateUserData(prev => ({
            ...prev,
            skillsOffered: updatedSkills
          }));
        } else {
          const updatedSkills = [...skillsWanted, savedSkill];
          setSkillsWanted(updatedSkills);
          updateUserData(prev => ({
            ...prev,
            skillsWanted: updatedSkills
          }));
        }
        
        setNewSkill({ name: '', level: 1, category: 'offered' });
        setSkillDialogOpen(false);
        toast.success('Skill added successfully!');
      }
    } catch (error) {
      toast.error('Failed to add skill');
    }
  };

  const handleEditSkill = async () => {
    try {
      const response = await api.put(`/update-skill/${editingSkill._id}`, editingSkill);
      
      if (response.data.success) {
        // Update local state
        if (editingSkill.category === 'offered') {
          const updatedSkills = skillsOffered.map(skill => 
            skill._id === editingSkill._id ? editingSkill : skill
          );
          setSkillsOffered(updatedSkills);
          updateUserData(prev => ({
            ...prev,
            skillsOffered: updatedSkills
          }));
        } else {
          const updatedSkills = skillsWanted.map(skill => 
            skill._id === editingSkill._id ? editingSkill : skill
          );
          setSkillsWanted(updatedSkills);
          updateUserData(prev => ({
            ...prev,
            skillsWanted: updatedSkills
          }));
        }
        
        setEditSkillDialogOpen(false);
        setEditingSkill(null);
        toast.success('Skill updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update skill');
    }
  };

  const handleDeleteSkill = async (skillId, category) => {
    try {
      const response = await api.delete(`/delete-skill/${skillId}`);
      
      if (response.data.success) {
        if (category === 'offered') {
          const updatedSkills = skillsOffered.filter(skill => skill._id !== skillId);
          setSkillsOffered(updatedSkills);
          updateUserData(prev => ({
            ...prev,
            skillsOffered: updatedSkills
          }));
        } else {
          const updatedSkills = skillsWanted.filter(skill => skill._id !== skillId);
          setSkillsWanted(updatedSkills);
          updateUserData(prev => ({
            ...prev,
            skillsWanted: updatedSkills
          }));
        }
        
        toast.success('Skill deleted successfully!');
      }
    } catch (error) {
      toast.error('Failed to delete skill');
    }
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      const response = await api.put('/update-profile', profileForm);
      
      if (response.data.success) {
        updateUserData(prev => ({
          ...prev,
          ...profileForm
        }));
        setProfileEditOpen(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase() || 'U';
  };

  const getLevelColor = (level) => {
    if (level >= 10) return '#FFD700'; // Gold
    if (level >= 5) return '#C0C0C0';  // Silver
    return '#CD7F32'; // Bronze
  };

  if (!user || loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  const userLevel = calculateLevel();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Profile Header */}
      <Paper elevation={3} sx={{ mb: 4, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
          <Box sx={{ position: 'relative' }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Fab
                  size="small"
                  component="label"
                  sx={{ width: 32, height: 32 }}
                >
                  <PhotoCameraIcon fontSize="small" />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                  />
                </Fab>
              }
            >
              <Avatar 
                src={profilePicture || user.profilePicture}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  fontSize: '2.5rem',
                  border: '4px solid rgba(255,255,255,0.3)'
                }}
              >
                {getInitials(user.name)}
              </Avatar>
            </Badge>
          </Box>
          
          <Box sx={{ ml: 4, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {user.name}
              </Typography>
              <Chip
                icon={<TrophyIcon />}
                label={`Level ${userLevel}`}
                sx={{ 
                  backgroundColor: getLevelColor(userLevel),
                  color: 'black',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              />
            </Box>
            
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
              {user.email}
            </Typography>
            
            {user.bio && (
              <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
                {user.bio}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {userExp?.acceptedTeachingRequests || 0}
                </Typography>
                <Typography variant="body2">Teaching Sessions</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {userExp?.totalPointsEarned || 0}
                </Typography>
                <Typography variant="body2">Points Earned</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {(skillsOffered.length || 0) + (skillsWanted.length || 0)}
                </Typography>
                <Typography variant="body2">Skills</Typography>
              </Box>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setProfileEditOpen(true)}
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.2)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
            }}
          >
            Edit Profile
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={4}>
        {/* Skills Matrix */}
        <Grid item xs={12} lg={8}>
          {/* Skills I Offer */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="primary" />
                  Skills I Offer
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setNewSkill({ ...newSkill, category: 'offered' });
                    setSkillDialogOpen(true);
                  }}
                >
                  Add Skill
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                {skillsOffered && skillsOffered.length > 0 ? (
                  skillsOffered.map((skill) => (
                    <Grid item xs={12} sm={6} md={4} key={skill._id || Math.random()}>
                      <Card variant="outlined" sx={{ p: 2, position: 'relative' }}>
                        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setEditingSkill({ ...skill, category: 'offered' });
                              setEditSkillDialogOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => handleDeleteSkill(skill._id, 'offered')}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        <Typography variant="h6" sx={{ mb: 1, pr: 6 }}>
                          {skill.skill}
                        </Typography>
                        <Rating value={skill.level || 1} max={5} readOnly />
                        <Typography variant="body2" color="textSecondary">
                          Level {skill.level || 1}/5
                        </Typography>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ width: '100%', textAlign: 'center', py: 2 }}>
                    No skills added yet. Click "Add Skill" to get started!
                  </Typography>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Skills I Want to Learn */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon color="secondary" />
                  Skills I Want to Learn
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setNewSkill({ ...newSkill, category: 'wanted' });
                    setSkillDialogOpen(true);
                  }}
                >
                  Add Skill
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                {skillsWanted && skillsWanted.length > 0 ? (
                  skillsWanted.map((skill) => (
                    <Grid item xs={12} sm={6} md={4} key={skill._id || Math.random()}>
                      <Card variant="outlined" sx={{ p: 2, position: 'relative' }}>
                        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setEditingSkill({ ...skill, category: 'wanted' });
                              setEditSkillDialogOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => handleDeleteSkill(skill._id, 'wanted')}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        <Typography variant="h6" sx={{ mb: 1, pr: 6 }}>
                          {skill.skill}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Interest Level: {skill.level || 1}/5
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(skill.level || 1) * 20} 
                          sx={{ mt: 1 }}
                        />
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ width: '100%', textAlign: 'center', py: 2 }}>
                    No skills added yet. Click "Add Skill" to get started!
                  </Typography>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Level Progress */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Level Progress
              </Typography>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h2" color="primary" sx={{ fontWeight: 'bold' }}>
                  {userLevel}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Current Level
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Progress to Level {userLevel + 1}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={((userExp?.acceptedTeachingRequests || 0) % 5) * 20}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="textSecondary">
                  {5 - ((userExp?.acceptedTeachingRequests || 0) % 5)} more teaching sessions needed
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="textSecondary">
                💡 Level up by accepting and completing teaching requests from other users!
              </Typography>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              {userExp?.skillsLearned?.slice(-3).map((skill, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2">
                    {skill.skill}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    +{skill.pointsEarned} points
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(skill.dateAchieved).toLocaleDateString()}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add/Edit Skill Dialog */}
      <Dialog open={skillDialogOpen} onClose={() => setSkillDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Skill</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Skill Name"
            fullWidth
            variant="outlined"
            value={newSkill.name}
            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <Typography gutterBottom>
            {newSkill.category === 'offered' ? 'Proficiency Level' : 'Interest Level'}
          </Typography>
          <Slider
            value={newSkill.level}
            onChange={(e, value) => setNewSkill({ ...newSkill, level: value })}
            min={1}
            max={5}
            marks
            step={1}
            valueLabelDisplay="auto"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkillDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSkill} variant="contained">Add Skill</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Skill Dialog */}
      <Dialog open={editSkillDialogOpen} onClose={() => setEditSkillDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Skill</DialogTitle>
        <DialogContent>
          {editingSkill && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Skill Name"
                fullWidth
                variant="outlined"
                value={editingSkill.skill || ''}
                onChange={(e) => setEditingSkill({ ...editingSkill, skill: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <Typography gutterBottom>
                {editingSkill.category === 'offered' ? 'Proficiency Level' : 'Interest Level'}
              </Typography>
              <Slider
                value={editingSkill.level || 1}
                onChange={(e, value) => setEditingSkill({ ...editingSkill, level: value })}
                min={1}
                max={5}
                marks
                step={1}
                valueLabelDisplay="auto"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditSkillDialogOpen(false); setEditingSkill(null); }}>Cancel</Button>
          <Button onClick={handleEditSkill} variant="contained">Update Skill</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={profileEditOpen} onClose={() => setProfileEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Full Name"
            fullWidth
            variant="outlined"
            value={profileForm.name}
            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            variant="outlined"
            value={profileForm.email}
            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Bio"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={profileForm.bio}
            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
            placeholder="Tell others about yourself..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileEditOpen(false)}>Cancel</Button>
          <Button onClick={handleProfileUpdate} variant="contained">Update Profile</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;