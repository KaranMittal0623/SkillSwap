const loginUser = require('./loginUser');
const User = require('../models/userSchema');

// Mock the database
jest.mock('../models/userSchema');
jest.mock('../config/redis');

describe('Login User - Simple Test', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        email: 'john@example.com',
        password: 'pass123'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  // TEST 1: Successful login
  test('TEST 1: User logs in successfully', async () => {
    // Create mock user with login methods
    const mockUser = {
      _id: '123',
      email: 'john@example.com',
      comparePassword: jest.fn().mockResolvedValueOnce(true), // Password matches
      generateAuthToken: jest.fn().mockReturnValueOnce('token123') // Generate token
    };

    User.findOne.mockResolvedValueOnce(mockUser); // User found in database

    await loginUser(req, res);

    // Check if response is 200 (OK)
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // TEST 2: User doesn't exist
  test('TEST 2: Show error when user not found', async () => {
    User.findOne.mockResolvedValueOnce(null); // No user found

    await loginUser(req, res);

    // Should return 401 (Unauthorized)
    expect(res.status).toHaveBeenCalledWith(401);
  });

  // TEST 3: Wrong password
  test('TEST 3: Show error for wrong password', async () => {
    const mockUser = {
      _id: '123',
      email: 'john@example.com',
      comparePassword: jest.fn().mockResolvedValueOnce(false) // Password doesn't match
    };

    User.findOne.mockResolvedValueOnce(mockUser);

    await loginUser(req, res);

    // Should return 401 (Unauthorized)
    expect(res.status).toHaveBeenCalledWith(401);
  });

  // TEST 4: Database error
  test('TEST 4: Handle database error', async () => {
    User.findOne.mockRejectedValueOnce(new Error('DB Error'));

    await loginUser(req, res);

    // Should return 500 (Server Error)
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
