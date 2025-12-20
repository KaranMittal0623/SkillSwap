import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/users`;

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Add timeout
    timeout: 30000 // Increased to 30 seconds to allow for email sending
});

// Add a request interceptor to add auth token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject({
            message: 'Error making request',
            error: error
        });
    }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Response Error:', error);
        console.error('Error Config:', error.config);
        console.error('Error Message:', error.message);
        console.error('Error Response:', error.response);
        
        // Handle different types of errors
        if (!error.response) {
            // Network error or server not responding
            console.error('Network Error - No response from server');
            return Promise.reject({
                message: 'Unable to reach the server. Please check if the server is running and you have internet connection.',
                error: error,
                details: error.message
            });
        }

        const status = error.response.status;
        const data = error.response.data;

        console.error(`HTTP Error ${status}:`, data);

        switch (status) {
            case 401:
                localStorage.removeItem('token');
                window.location.href = '/login';
                return Promise.reject({
                    message: 'Session expired. Please login again.',
                    error: data
                });
            case 404:
                return Promise.reject({
                    message: data?.message || 'Resource not found',
                    error: data
                });
            case 400:
                return Promise.reject({
                    message: data?.message || 'Invalid request',
                    error: data
                });
            case 500:
                return Promise.reject({
                    message: data?.message || 'Server error. Please try again later.',
                    error: data
                });
            default:
                return Promise.reject({
                    message: data?.message || 'Something went wrong',
                    error: data
                });
        }
    }
);

export default api;