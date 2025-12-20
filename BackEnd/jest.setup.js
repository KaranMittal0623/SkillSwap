// Jest setup file
jest.setTimeout(30000);

// Suppress Redis/Queue connection errors during tests
console.error = jest.fn();
console.warn = jest.fn();
console.log = jest.fn();

// Mock Redis module
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  })),
}));

// Mock ioredis module
jest.mock('ioredis', () => {
  return jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  }));
});

// Mock bull queues
jest.mock('bull', () => {
  return jest.fn(() => ({
    process: jest.fn(),
    add: jest.fn().mockResolvedValue({ id: 1 }),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  }));
});

beforeAll(() => {
  // Setup
});

afterEach(() => {
  jest.clearAllMocks();
});
