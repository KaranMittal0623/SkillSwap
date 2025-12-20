const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const skillSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: true
    },
    level: {
        type: Number,
        min: 1,
        max: 5,
        default: 1
    },
    dateAdded: {
        type: Date,
        default: Date.now
    },
    dateModified: {
        type: Date,
        default: Date.now
    }
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    bio: {
        type: String,
        maxlength: 500,
        trim: true
    },
    profilePicture: {
        type: String,
        default: null
    },
    level: {
        type: Number,
        default: 1,
        min: 1
    },
    skillsOffered: [skillSchema],
    skillsWanted: [skillSchema],
    // Legacy field for backward compatibility
    skills: [{
        type: String
    }]
}, {
    timestamps: true
});

userSchema.pre('save', async function(next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});


userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign(
        { userId: this._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    return token;
};


userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};


userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

module.exports = mongoose.model('User', userSchema);