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
  Chip
} from '@mui/material';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Profile = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [userExp, setUserExp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

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

  if (!user || loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                bgcolor: 'primary.main',
                fontSize: '2rem'
              }}
            >
              {getInitials(user.name)}
            </Avatar>
            <Box sx={{ ml: 3 }}>
              <Typography variant="h4">{user.name}</Typography>
              <Typography variant="body1" color="textSecondary">{user.email}</Typography>
              {userExp && (
                <Typography variant="h6" color="primary">
                  Level {userExp.level || 1}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Grid container spacing={3}>
        {/* Skills Offering */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Skills I'm Offering
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {user.skills?.map((skill, index) => (
                  <Chip 
                    key={index}
                    label={skill}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Learning Progress */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Learning Progress
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Points: {userExp?.totalPointsEarned || 0}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={((userExp?.totalPointsEarned || 0) % 100)} 
                  sx={{ height: 10, borderRadius: 5, mt: 1 }}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {100 - ((userExp?.totalPointsEarned || 0) % 100)} points to next level
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Learning Activity
              </Typography>
              {userExp?.skillsLearned?.slice(-5).map((skill, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">
                    {skill.skill}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Points earned: {skill.pointsEarned}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(skill.dateAchieved).toLocaleDateString()}
                  </Typography>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;