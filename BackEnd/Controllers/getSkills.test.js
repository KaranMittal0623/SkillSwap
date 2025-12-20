// Mock the dependencies FIRST
jest.mock('../models/userSchema');
jest.mock('../config/redis');

const getSkills = require('./getSkills');
const User = require('../models/userSchema');
const { client } = require('../config/redis');

describe('Get Skills - Simple Test', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
    
    // Ensure client mock methods exist
    if (client && !client.get) {
      client.get = jest.fn().mockResolvedValue(null);
      client.setEx = jest.fn().mockResolvedValue('OK');
    }
  });

  // TEST 1: Return skills from cache
  test('TEST 1: Get skills from cache', async () => {
    const cachedSkills = [
      { skill: 'JavaScript', level: 3 },
      { skill: 'React', level: 2 }
    ];

    // Mock cache returns data
    client.get.mockResolvedValueOnce(JSON.stringify(cachedSkills));

    await getSkills(req, res);

    // Should return 200 (OK) with skills
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // TEST 2: Fetch from database when cache is empty
  test('TEST 2: Fetch skills from database', async () => {
    const mockUsers = [
      {
        _id: { toString: () => '123' },
        name: 'John',
        email: 'john@example.com',
        skillsOffered: [
          { 
            _id: { toString: () => '456' },
            skill: 'JavaScript',
            level: 3
          }
        ],
        skillsWanted: []
      }
    ];

    // No cache data
    client.get.mockResolvedValueOnce(null);
    // Get users from database with lean() chain
    User.find.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(mockUsers)
    });
    // Store in cache
    client.setEx.mockResolvedValueOnce(true);

    await getSkills(req, res);

    // Should return 200 (OK)
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // TEST 3: Return empty when no users
  test('TEST 3: Handle empty database', async () => {
    // No cache
    client.get.mockResolvedValueOnce(null);
    // No users in database with lean() chain
    User.find.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce([])
    });
    client.setEx.mockResolvedValueOnce(true);

    await getSkills(req, res);

    // Should return 200 with empty skills
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
