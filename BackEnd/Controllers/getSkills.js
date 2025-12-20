const User = require('../models/userSchema');
const { client } = require('../config/redis');

const SKILLS_CACHE_KEY = 'allSkills';
const SKILLS_CACHE_EXPIRY = 600; // 10 minutes

const getSkills = async (req, res) => {
    try {
        console.log('getSkills: Starting to fetch skills');
        
        // Check if skills are in cache
        let cachedSkills;
        try {
            cachedSkills = await client.get(SKILLS_CACHE_KEY);
            if (cachedSkills) {
                console.log('getSkills: Returning skills from cache');
                return res.status(200).json({
                    success: true,
                    skills: JSON.parse(cachedSkills),
                    fromCache: true
                });
            }
        } catch (cacheError) {
            console.warn('Cache error, proceeding without cache:', cacheError.message);
        }

        console.log('getSkills: Cache miss, fetching from database');
        
        // Find all users and select their skills
        const users = await User.find({}, 'name email skillsOffered skillsWanted').lean();
        console.log(`getSkills: Found ${users.length} users`);
        
        const formattedSkills = users.reduce((acc, user) => {
            // Process offered skills only (we're showing what people are teaching)
            if (user.skillsOffered && Array.isArray(user.skillsOffered) && user.skillsOffered.length > 0) {
                const offeredSkills = user.skillsOffered.map(skillObj => {
                    // skillObj should have: { _id, skill, level, dateAdded, dateModified }
                    const skillName = skillObj.skill;
                    const skillLevel = skillObj.level || 1;
                    
                    if (!skillName || skillName.trim().length === 0) {
                        console.warn(`getSkills: Skipping invalid skill for user ${user._id}`);
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

        console.log(`getSkills: Formatted ${formattedSkills.length} total skills from ${users.length} users`);

        // Log sample skills if available
        if (formattedSkills.length > 0) {
            console.log(`getSkills: Sample skills:`, formattedSkills.slice(0, 3));
        } else {
            console.warn('getSkills: No skills found in database');
        }

        // Store in cache for 10 minutes
        try {
            await client.setEx(SKILLS_CACHE_KEY, SKILLS_CACHE_EXPIRY, JSON.stringify(formattedSkills));
            console.log('getSkills: Cached skills successfully');
        } catch (cacheError) {
            console.warn('getSkills: Failed to cache skills:', cacheError.message);
        }

        res.status(200).json({
            success: true,
            skills: formattedSkills,
            count: formattedSkills.length
        });

    } catch (error) {
        console.error('getSkills: Error fetching skills:', error);
        console.error('getSkills: Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error fetching skills',
            error: error.message
        });
    }
};

module.exports = getSkills;
