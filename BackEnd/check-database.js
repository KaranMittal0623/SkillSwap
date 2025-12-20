const mongoose = require('mongoose');
const User = require('./models/userSchema');
require('dotenv').config();

async function checkSkills() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('✓ Connected to database');

        // Get all users
        const users = await User.find({});
        console.log(`\n📊 Total users: ${users.length}`);

        if (users.length === 0) {
            console.log('⚠️  No users found in database');
            process.exit(0);
        }

        // Check each user's skills
        users.forEach((user, index) => {
            console.log(`\n👤 User ${index + 1}: ${user.name} (${user.email})`);
            console.log(`   ID: ${user._id}`);
            
            console.log(`   📚 Skills Offered: ${user.skillsOffered?.length || 0}`);
            if (user.skillsOffered && user.skillsOffered.length > 0) {
                user.skillsOffered.forEach((skill, i) => {
                    console.log(`      ${i + 1}. ${skill.skill} (Level: ${skill.level || 1})`);
                    console.log(`         ID: ${skill._id}`);
                });
            }
            
            console.log(`   🎓 Skills Wanted: ${user.skillsWanted?.length || 0}`);
            if (user.skillsWanted && user.skillsWanted.length > 0) {
                user.skillsWanted.forEach((skill, i) => {
                    console.log(`      ${i + 1}. ${skill.skill} (Level: ${skill.level || 1})`);
                });
            }
        });

        // Now simulate what getSkills does
        console.log('\n\n🔍 Simulating getSkills logic:');
        const formattedSkills = users.reduce((acc, user) => {
            if (user.skillsOffered && Array.isArray(user.skillsOffered) && user.skillsOffered.length > 0) {
                const offeredSkills = user.skillsOffered.map(skillObj => {
                    const skillName = skillObj.skill;
                    const skillLevel = skillObj.level || 1;
                    
                    if (!skillName || skillName.trim().length === 0) {
                        console.warn(`❌ Invalid skill for user ${user._id}`);
                        return null;
                    }
                    
                    return {
                        _id: skillObj._id ? skillObj._id.toString() : `${user._id}-${skillName}-${Math.random()}`,
                        skill: skillName,
                        level: skillLevel,
                        type: 'offered',
                        user: {
                            _id: user._id.toString(),
                            name: user.name,
                            email: user.email
                        }
                    };
                }).filter(skill => skill !== null);
                
                acc.push(...offeredSkills);
            }
            
            return acc;
        }, []);

        console.log(`\n✓ Total formatted skills: ${formattedSkills.length}`);
        if (formattedSkills.length > 0) {
            console.log('\nSample formatted skills:');
            formattedSkills.slice(0, 3).forEach((skill, index) => {
                console.log(`\n  ${index + 1}. ${skill.skill}`);
                console.log(`     Offered by: ${skill.user.name}`);
                console.log(`     Level: ${skill.level}`);
                console.log(`     ID: ${skill._id}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

checkSkills();
