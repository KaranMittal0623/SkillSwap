const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 5000;
const userRoutes = require('./Routes/userRoutes');
const {connectRedis} = require('./config/redis');

// Connect to Redis
connectRedis();

// Middleware
app.use(cors());
app.use(express.json());



// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Routes
app.use('/api/users', userRoutes);

app.get('/',(req,res)=>{
    res.send('Hello World');
})

const connectDB = require('./config/dataBase');
connectDB();

app.listen(PORT, (req,res)=>{
    console.log(`Server is running on port ${PORT}`);
})