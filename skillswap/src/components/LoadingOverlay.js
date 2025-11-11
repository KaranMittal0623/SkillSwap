import React from 'react';
import { Backdrop, CircularProgress } from '@mui/material';
import { useUser } from '../context/UserContext';

const LoadingOverlay = () => {
  const { globalLoading } = useUser();

  return (
    <Backdrop
      sx={{ 
        color: '#fff', 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)'
      }}
      open={globalLoading}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

export default LoadingOverlay;