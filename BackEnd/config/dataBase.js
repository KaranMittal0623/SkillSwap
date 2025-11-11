const mongoose = require('mongoose');

const connectDB = async (req,res) => {mongoose.connect(process.env.DATABASE_URL).then(()=>{
        console.log('Connected to Database');
    }).catch((err)=>{
        console.log('Error connecting to Database', err);
    });
}

module.exports = connectDB;