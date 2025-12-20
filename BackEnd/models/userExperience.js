const mongoose = require('mongoose');

const userExperienceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    learningPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    skillsLearned: [{
        skill: {
            type: String,
            required: true
        },
        pointsEarned: {
            type: Number,
            default: 0
        },
        dateAchieved: {
            type: Date,
            default: Date.now
        }
    }],
    totalPointsEarned: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    acceptedTeachingRequests: {
        type: Number,
        default: 0
    },
    teachingHistory: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        skill: String,
        completedAt: {
            type: Date,
            default: Date.now
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        }
    }]
}, {
    timestamps: true
});

// Method to add points
userExperienceSchema.methods.addPoints = async function(points, skillName) {
    // Increment learning points and total points
    this.learningPoints += points;
    this.totalPointsEarned += points;
    
    // Add or update skill in skillsLearned
    const skillIndex = this.skillsLearned.findIndex(s => s.skill === skillName);
    if (skillIndex > -1) {
        this.skillsLearned[skillIndex].pointsEarned += points;
    } else {
        this.skillsLearned.push({
            skill: skillName,
            pointsEarned: points
        });
    }

    // Update level (every 100 points)
    this.level = Math.floor(this.totalPointsEarned / 100) + 1;
    
    // Save the changes
    await this.save();
    return this;
};

const UserExperience = mongoose.model('UserExperience', userExperienceSchema);
module.exports = UserExperience;

