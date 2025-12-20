import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Box, 
  Paper,
  Avatar,
  Chip,
  Fade,
  Grow
} from '@mui/material';
import {
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Star as StarIcon,
  Code as CodeIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Science as ScienceIcon,
  Business as BusinessIcon,
  FitnessCenter as FitnessIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../services/api';

const Home = () => {
  const { user } = useUser();
  const [featuredSkills, setFeaturedSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Skill category icons mapping
  const getSkillIcon = (skillName) => {
    const skill = skillName.toLowerCase();
    if (skill.includes('web') || skill.includes('react') || skill.includes('javascript') || skill.includes('node')) {
      return <CodeIcon />;
    } else if (skill.includes('design') || skill.includes('photoshop') || skill.includes('illustrator')) {
      return <PaletteIcon />;
    } else if (skill.includes('language') || skill.includes('spanish') || skill.includes('french')) {
      return <LanguageIcon />;
    } else if (skill.includes('data') || skill.includes('python') || skill.includes('machine')) {
      return <ScienceIcon />;
    } else if (skill.includes('business') || skill.includes('marketing') || skill.includes('finance')) {
      return <BusinessIcon />;
    } else if (skill.includes('fitness') || skill.includes('yoga') || skill.includes('health')) {
      return <FitnessIcon />;
    } else {
      return <SchoolIcon />;
    }
  };

  const getSkillColor = (index) => {
    const colors = ['#2196F3', '#FF5722', '#4CAF50', '#9C27B0', '#FF9800', '#E91E63'];
    return colors[index % colors.length];
  };

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await api.get('/skills');
        if (response.data.skills) {
          // Group skills by name and count users
          const skillGroups = {};
          response.data.skills.forEach(skill => {
            if (!skillGroups[skill.skill]) {
              skillGroups[skill.skill] = {
                name: skill.skill,
                users: [],
                totalLevel: 0,
                count: 0
              };
            }
            skillGroups[skill.skill].users.push(skill.user);
            skillGroups[skill.skill].totalLevel += skill.level || 1;
            skillGroups[skill.skill].count += 1;
          });

          // Convert to featured skills format
          const skills = Object.values(skillGroups)
            .sort((a, b) => b.count - a.count) // Sort by popularity
            .slice(0, 6) // Take top 6
            .map((skill, index) => ({
              id: index + 1,
              name: skill.name,
              description: `Learn ${skill.name} from ${skill.count} experienced ${skill.count === 1 ? 'teacher' : 'teachers'}`,
              icon: getSkillIcon(skill.name),
              color: getSkillColor(index),
              students: skill.count,
              rating: Math.min(5, Math.max(4, (skill.totalLevel / skill.count) + 3.5)) // Convert level to rating
            }));

          setFeaturedSkills(skills);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
        // Fallback to empty array
        setFeaturedSkills([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  const stats = [
    { label: 'Active Learners', value: '10,000+', icon: <PeopleIcon /> },
    { label: 'Skills Available', value: '500+', icon: <SchoolIcon /> },
    { label: 'Success Rate', value: '95%', icon: <TrendingUpIcon /> },
    { label: 'Average Rating', value: '4.8', icon: <StarIcon /> }
  ];

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          pt: 8,
          pb: 12,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Fade in timeout={1000}>
            <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <Typography
                component="h1"
                variant="h2"
                sx={{ 
                  fontWeight: 'bold', 
                  mb: 3,
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}
              >
                🎓 Welcome to SkillSwap
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 4, 
                  opacity: 0.9,
                  maxWidth: '800px',
                  mx: 'auto',
                  lineHeight: 1.6
                }}
              >
                The world's largest peer-to-peer learning platform. Share your expertise, 
                learn new skills, and grow together with our global community of passionate learners.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                {user ? (
                  <>
                    <Button 
                      variant="contained" 
                      size="large"
                      component={Link} 
                      to="/search"
                      sx={{ 
                        backgroundColor: 'white',
                        color: 'primary.main',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        '&:hover': { backgroundColor: 'grey.100' }
                      }}
                    >
                      Explore Skills
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="large"
                      component={Link} 
                      to="/profile"
                      sx={{ 
                        borderColor: 'white',
                        color: 'white',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        '&:hover': { 
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      My Profile
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="contained" 
                      size="large"
                      component={Link} 
                      to="/signup"
                      sx={{ 
                        backgroundColor: 'white',
                        color: 'primary.main',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        '&:hover': { backgroundColor: 'grey.100' }
                      }}
                    >
                      Get Started Free
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="large"
                      component={Link} 
                      to="/search"
                      sx={{ 
                        borderColor: 'white',
                        color: 'white',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        '&:hover': { 
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Browse Skills
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Fade>
        </Container>
        
        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.1)',
            zIndex: 1
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.05)',
            zIndex: 1
          }}
        />
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ mt: -6, mb: 8, position: 'relative', zIndex: 3 }}>
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Grow in timeout={1000 + index * 200}>
                <Paper
                  elevation={4}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                    color: 'white'
                  }}
                >
                  <Avatar
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      mx: 'auto',
                      mb: 1,
                      width: 48,
                      height: 48
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {stat.label}
                  </Typography>
                </Paper>
              </Grow>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Featured Skills Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
            🌟 Popular Skills
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
            Discover the most in-demand skills our community is learning and teaching
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={12} sm={6} lg={4} key={index}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 48, height: 48, mr: 2, bgcolor: 'grey.300' }} />
                      <Typography variant="h6" color="grey.400">Loading...</Typography>
                    </Box>
                    <Typography variant="body2" color="grey.400" sx={{ mb: 2 }}>
                      Loading skill information...
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : featuredSkills.length > 0 ? (
            featuredSkills.map((skill, index) => (
            <Grid item xs={12} sm={6} lg={4} key={skill.id}>
              <Grow in timeout={1200 + index * 150}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <Box
                    sx={{
                      background: `linear-gradient(45deg, ${skill.color}22, ${skill.color}11)`,
                      p: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Avatar
                      sx={{
                        backgroundColor: skill.color,
                        color: 'white',
                        width: 56,
                        height: 56
                      }}
                    >
                      {skill.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {skill.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StarIcon sx={{ color: '#FFD700', fontSize: 16 }} />
                        <Typography variant="body2" color="text.secondary">
                          {skill.rating} • {skill.students.toLocaleString()} learners
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      {skill.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip label="Beginner Friendly" size="small" />
                      <Chip label="Interactive" size="small" />
                    </Box>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<PlayArrowIcon />}
                      component={Link}
                      to="/search"
                      sx={{ mt: 'auto' }}
                    >
                      Start Learning
                    </Button>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))
          ) : (
            // No skills fallback
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No skills available yet. Be the first to share your expertise!
                </Typography>
                <Button 
                  variant="contained" 
                  component={Link} 
                  to="/profile" 
                  sx={{ mt: 2 }}
                >
                  Add Your Skills
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </Container>

      {/* Why Choose SkillSwap Section */}
      <Box sx={{ backgroundColor: '#f8f9fa', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
              🚀 Why SkillSwap?
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Join thousands of learners who are transforming their lives through peer-to-peer education
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'translateY(-5px)' }
                }}
              >
                <Avatar
                  sx={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Community Driven
                </Typography>
                <Typography color="text.secondary">
                  Learn from real people with real experience. Our peer-to-peer approach 
                  creates authentic learning connections that traditional courses can't match.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'translateY(-5px)' }
                }}
              >
                <Avatar
                  sx={{
                    backgroundColor: '#2196F3',
                    color: 'white',
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Track Your Growth
                </Typography>
                <Typography color="text.secondary">
                  Monitor your progress with our comprehensive tracking system. 
                  Level up, earn badges, and see your skills improve over time.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'translateY(-5px)' }
                }}
              >
                <Avatar
                  sx={{
                    backgroundColor: '#FF5722',
                    color: 'white',
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <SchoolIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Unlimited Learning
                </Typography>
                <Typography color="text.secondary">
                  Access hundreds of skills across technology, arts, business, and more. 
                  From coding to cooking, there's always something new to discover.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      {!user && (
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Paper
            elevation={4}
            sx={{
              p: 6,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
              Ready to Start Learning?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join our community today and unlock your potential through peer-to-peer learning
            </Typography>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/signup"
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': { backgroundColor: 'grey.100' }
              }}
            >
              Sign Up Now - It's Free!
            </Button>
          </Paper>
        </Container>
      )}
    </>
  );
};

export default Home;