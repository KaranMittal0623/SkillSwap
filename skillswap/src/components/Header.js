import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';

const Header = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          SkillSwap
        </Typography>
        <Button color="inherit" component={Link} to="/">Home</Button>
        <Button color="inherit" component={Link} to="/search">Search Skills</Button>
        <Button color="inherit" component={Link} to="/profile">Profile</Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/chat"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <ChatBubbleIcon />
          Messages
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;