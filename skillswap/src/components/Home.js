import React from 'react';
import { Container, Typography, Grid, Card, CardContent, Button, Box, Paper } from '@mui/material';
import { Link } from 'react-router-dom';

const Home = () => {
  const featuredSkills = [
    { id: 1, name: 'Web Development', description: 'Learn modern web technologies' },
    { id: 2, name: 'Graphic Design', description: 'Master design principles and tools' },
    { id: 3, name: 'Language Learning', description: 'Exchange language learning skills' },
  ];

  return (
    <>
      <Box
        sx={{
          backgroundColor: '#f5f5f5',
          pt: 8,
          pb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="text.primary"
            gutterBottom
          >
            Welcome to SkillSwap
          </Typography>
          <Typography variant="h5" align="center" color="text.secondary" paragraph>
            Empower yourself through skill exchange! Connect with others who want to learn what you know,
            and teach what they want to learn. Join our community of lifelong learners today.
          </Typography>
          <Box sx={{ mt: 4 }} display="flex" justifyContent="center" gap={2}>
            <Button variant="contained" color="primary" component={Link} to="/search">
              Find Skills
            </Button>
            <Button variant="outlined" color="primary" component={Link} to="/login">
              Get Started
            </Button>
          </Box>
        </Container>
      </Box>

      <Container sx={{ py: 8 }} maxWidth="lg">
        <Typography variant="h3" align="center" gutterBottom>
          Featured Skills
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" paragraph>
          Discover popular skills that members are exchanging
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {featuredSkills.map((skill) => (
            <Grid item xs={12} sm={4} key={skill.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    transition: 'transform 0.3s ease-in-out',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {skill.name}
                  </Typography>
                  <Typography color="text.secondary">
                    {skill.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Paper sx={{ mt: 8, p: 4, textAlign: 'center', backgroundColor: '#f8f9fa' }}>
          <Typography variant="h4" gutterBottom>
            Why Choose SkillSwap?
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                🤝 Community Learning
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Learn directly from peers who are passionate about sharing their knowledge
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                📈 Track Progress
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor your learning journey with our progress tracking system
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                💡 Diverse Skills
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Access a wide range of skills from tech to arts and beyond
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </>
  );
};

export default Home;