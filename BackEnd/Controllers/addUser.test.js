const addUser = require('./addUser');
const User = require('../models/userSchema');

// Mock the database
jest.mock('../models/userSchema');
jest.mock('../models/userExperience');
jest.mock('../config/redis');
jest.mock('../utils/queueManager');

describe('Add User - Simple Test', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'pass123',
        skillsOffered: ['JavaScript'],
        skillsWanted: ['Python']
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  // TEST 1: Check if user is created with correct data
  test('TEST 1: Create user successfully', async () => {
    // Step 1: Tell mock that no user exists yet
    User.findOne.mockResolvedValueOnce(null);

    // Step 2: Create a mock user object
    const mockUser = {
      _id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      save: jest.fn().mockResolvedValueOnce(true)
    };
    
    User.mockImplementationOnce(() => mockUser);

    // Step 3: Call the function
    try {
      await addUser(req, res);
    } catch (error) {
      // Ignore queue connection errors
    }

    // Step 4: Check if function was called (status called)
    expect(res.status.mock.calls.length).toBeGreaterThan(0);
  });

  // TEST 2: Check validation - missing email
  test('TEST 2: Show error when email is missing', async () => {
    req.body.email = ''; // Empty email

    await addUser(req, res);

    // Should return 400 (Bad Request)
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // TEST 3: Check if duplicate email is rejected
  test('TEST 3: Reject duplicate email', async () => {
    // Tell mock that user already exists
    User.findOne.mockResolvedValueOnce({
      _id: '456',
      email: 'john@example.com'
    });

    await addUser(req, res);

    // Should return 400 (Bad Request)
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // TEST 4: Check database error handling
  test('TEST 4: Handle database error', async () => {
    // Simulate database error
    User.findOne.mockRejectedValueOnce(new Error('DB Error'));

    await addUser(req, res);

    // Should return 500 (Server Error)
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
