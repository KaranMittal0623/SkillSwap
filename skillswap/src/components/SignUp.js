import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box,
  Grid,
  Link,
  Chip
} from '@mui/material';
import { useUser } from '../context/UserContext';

const SignUp = () => {
  const navigate = useNavigate();
  const { register } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    skillsOffered: [],
    skillsWanted: []
  });
  
  const [newSkill, setNewSkill] = useState('');
  const [skillType, setSkillType] = useState('offered'); // 'offered' or 'wanted'
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddSkill = () => {
    const skillArray = skillType === 'offered' ? 'skillsOffered' : 'skillsWanted';
    if (newSkill && !formData[skillArray].includes(newSkill)) {
      setFormData({
        ...formData,
        [skillArray]: [...formData[skillArray], newSkill]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove, type) => {
    const skillArray = type === 'offered' ? 'skillsOffered' : 'skillsWanted';
    setFormData({
      ...formData,
      [skillArray]: formData[skillArray].filter(skill => skill !== skillToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log('Starting registration process...');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password should be at least 6 characters long");
      return;
    }

    try {
      console.log('Sending registration data:', {
        name: formData.name,
        email: formData.email,
        skillsOffered: formData.skillsOffered,
        skillsWanted: formData.skillsWanted
      });

      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        skillsOffered: formData.skillsOffered,
        skillsWanted: formData.skillsWanted
      });

      console.log('Registration result:', result);

      if (result.success) {
        navigate('/login');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'An error occurred during registration');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Sign Up for SkillSwap
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              margin="normal"
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Skills
                  </Typography>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={7}>
                      <TextField
                        fullWidth
                        label="Add a skill"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <Button
                        variant="contained"
                        color={skillType === 'offered' ? 'primary' : 'secondary'}
                        onClick={() => setSkillType('offered')}
                        fullWidth
                        size="small"
                      >
                        Offer
                      </Button>
                    </Grid>
                    <Grid item xs={2}>
                      <Button
                        variant="contained"
                        color={skillType === 'wanted' ? 'primary' : 'secondary'}
                        onClick={() => setSkillType('wanted')}
                        fullWidth
                        size="small"
                      >
                        Want
                      </Button>
                    </Grid>
                    <Grid item xs={1}>
                      <Button
                        variant="contained"
                        onClick={handleAddSkill}
                        fullWidth
                      >
                        +
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Skills You Offer:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {formData.skillsOffered.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        color="primary"
                        onDelete={() => handleRemoveSkill(skill, 'offered')}
                      />
                    ))}
                  </Box>

                  <Typography variant="subtitle2" color="secondary" gutterBottom>
                    Skills You Want to Learn:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.skillsWanted.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        color="secondary"
                        onDelete={() => handleRemoveSkill(skill, 'wanted')}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
            >
              Sign Up
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/login')}
                >
                  Login here
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignUp;