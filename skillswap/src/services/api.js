import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';  // Adjust port if different

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
        
        // Handle different types of errors
        if (!error.response) {
            // Network error or server not responding
            return Promise.reject({
                message: 'Unable to reach the server. Please check your connection.',
                error: error
            });
        }

        switch (error.response.status) {
            case 401:
                localStorage.removeItem('token');
                window.location.href = '/login';
                break;
            case 404:
                return Promise.reject({
                    message: 'Resource not found',
                    error: error.response.data
                });
            case 400:
                return Promise.reject({
                    message: error.response.data.message || 'Invalid request',
                    error: error.response.data
                });
            case 500:
                return Promise.reject({
                    message: 'Server error. Please try again later.',
                    error: error.response.data
                });
            default:
                return Promise.reject({
                    message: error.response.data.message || 'Something went wrong',
                    error: error.response.data
                });
        }
        return Promise.reject(error);
    }
);

export default api;