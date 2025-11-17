const BASE_URL = 'http://localhost:5000/api/users';

const testUsers = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
    skillsOffered: ['Python', 'Data Science', 'Machine Learning'],
    skillsWanted: ['Web Development', 'React']
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'password123',
    skillsOffered: ['Web Development', 'React', 'Node.js'],
    skillsWanted: ['Python', 'Data Science']
  },
  {
    name: 'Carol Davis',
    email: 'carol@example.com',
    password: 'password123',
    skillsOffered: ['UI/UX Design', 'Figma', 'CSS'],
    skillsWanted: ['JavaScript', 'Backend Development']
  },
  {
    name: 'David Miller',
    email: 'david@example.com',
    password: 'password123',
    skillsOffered: ['AWS', 'Docker', 'Kubernetes'],
    skillsWanted: ['Go Programming', 'System Design']
  },
  {
    name: 'Emma Wilson',
    email: 'emma@example.com',
    password: 'password123',
    skillsOffered: ['Project Management', 'Agile', 'Leadership'],
    skillsWanted: ['Technical Writing', 'DevOps']
  },
  {
    name: 'Frank Brown',
    email: 'frank@example.com',
    password: 'password123',
    skillsOffered: ['Mobile App Development', 'Swift', 'Flutter'],
    skillsWanted: ['Cloud Architecture', 'Microservices']
  },
  {
    name: 'Grace Lee',
    email: 'grace@example.com',
    password: 'password123',
    skillsOffered: ['Database Design', 'SQL', 'MongoDB'],
    skillsWanted: ['GraphQL', 'REST API Design']
  },
  {
    name: 'Henry Taylor',
    email: 'henry@example.com',
    password: 'password123',
    skillsOffered: ['Testing', 'QA', 'Automation Testing'],
    skillsWanted: ['Performance Optimization', 'Security']
  }
];

const registerUsers = async () => {
  console.log('Starting user registration...');
  
  for (const user of testUsers) {
    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✓ Registered: ${user.name}`);
      } else if (response.status === 400 && data.message.includes('already exists')) {
        console.log(`⚠ Already exists: ${user.name}`);
      } else {
        console.error(`✗ Error registering ${user.name}: ${data.message}`);
      }
    } catch (error) {
      console.error(`✗ Error registering ${user.name}:`, error.message);
    }
  }
  
  console.log('\nRegistration complete. Fetching all skills...');
  
  try {
    const response = await fetch(`${BASE_URL}/skills`);
    const data = await response.json();
    console.log(`\nTotal skills in database: ${data.skills.length}`);
    console.log('\nSkills list:');
    data.skills.forEach((skill, idx) => {
      console.log(`${idx + 1}. ${skill.name} (${skill.type}) - by ${skill.user.name}`);
    });
  } catch (error) {
    console.error('Error fetching skills:', error.message);
  }
};

registerUsers();
