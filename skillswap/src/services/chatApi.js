import axios from 'axios';

const CHAT_API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/chat`;

// Create axios instance for chat API
const chatApi = axios.create({
    baseURL: CHAT_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000
});

// Add a request interceptor to add auth token
chatApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Chat API Request Error:', error);
        return Promise.reject({
            message: 'Error making chat request',
            error: error
        });
    }
);

// Add a response interceptor to handle common errors
chatApi.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Chat API Response Error:', error);
        
        if (!error.response) {
            return Promise.reject({
                message: 'Unable to reach the chat server. Please check your connection.',
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
                    message: 'Chat resource not found',
                    error: error.response.data
                });
            case 400:
                return Promise.reject({
                    message: error.response.data.message || 'Invalid chat request',
                    error: error.response.data
                });
            case 500:
                return Promise.reject({
                    message: 'Chat server error. Please try again later.',
                    error: error.response.data
                });
            default:
                return Promise.reject({
                    message: error.response.data.message || 'Something went wrong with chat',
                    error: error.response.data
                });
        }
        return Promise.reject(error);
    }
);

export default chatApi;
