const mongoose = require('mongoose');
const User = require('./models/userSchema');

(async () => {
  try {
    await mongoose.connect('mongodb+srv://karan:karan@cluster0.8kgqmyy.mongodb.net/skillswap');
    const users = await User.find({}).select('name skillsOffered skillsWanted');
    console.log('Total users:', users.length);
    users.forEach((user, idx) => {
      const offeredCount = (user.skillsOffered || []).length;
      const wantedCount = (user.skillsWanted || []).length;
      const totalSkillsForUser = offeredCount + wantedCount;
      console.log(`User ${idx + 1}: ${user.name} - Offered: ${offeredCount}, Wanted: ${wantedCount}, Total: ${totalSkillsForUser}`);
    });
    const totalSkills = users.reduce((sum, user) => sum + (user.skillsOffered || []).length + (user.skillsWanted || []).length, 0);
    console.log('Total skills across all users:', totalSkills);
    await mongoose.connection.close();
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
