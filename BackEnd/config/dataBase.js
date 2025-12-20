const mongoose = require('mongoose');

const connectDB = async (req,res) => {
    try {
        console.log('Attempting to connect to MongoDB at:', process.env.DATABASE_URL);
        await mongoose.connect(process.env.DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            connectTimeoutMS: 10000,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log('✓ Connected to Database successfully');
    } catch (err) {
        console.error('✗ Error connecting to Database:', err.message);
        console.error('Database URL:', process.env.DATABASE_URL);
        console.error('Full error:', err);
        // Don't exit, allow the server to start anyway
        // process.exit(1);
    }
}

module.exports = connectDB;