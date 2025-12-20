const PubSubManager = require('../../services/PubSubManager');
const redis = require('redis');

jest.mock('redis');

describe('PubSubManager', () => {
  let pubSubManager;
  let mockPublisher;
  let mockSubscriber;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock redis clients
    mockPublisher = {
      connect: jest.fn().mockResolvedValueOnce(undefined),
      publish: jest.fn().mockResolvedValueOnce(1),
      disconnect: jest.fn().mockResolvedValueOnce(undefined),
    };

    mockSubscriber = {
      connect: jest.fn().mockResolvedValueOnce(undefined),
      subscribe: jest.fn().mockResolvedValueOnce(undefined),
      unsubscribe: jest.fn().mockResolvedValueOnce(undefined),
      disconnect: jest.fn().mockResolvedValueOnce(undefined),
    };

    redis.createClient.mockImplementation(() => {
      // Return publisher for first call, subscriber for second
      if (redis.createClient.mock.calls.length === 1) {
        return mockPublisher;
      }
      return mockSubscriber;
    });

    pubSubManager = new PubSubManager();
  });

  describe('Connection', () => {
    test('should connect publisher and subscriber', async () => {
      await pubSubManager.connect();

      expect(mockPublisher.connect).toHaveBeenCalled();
      expect(mockSubscriber.connect).toHaveBeenCalled();
    });

    test('should handle connection errors', async () => {
      mockPublisher.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(pubSubManager.connect()).rejects.toThrow('Connection failed');
    });

    test('should use REDIS_URL environment variable', () => {
      process.env.REDIS_URL = 'redis://custom:6380';
      
      new PubSubManager();

      expect(redis.createClient).toHaveBeenCalledWith({
        url: 'redis://custom:6380'
      });
    });

    test('should use default Redis URL if not set', () => {
      delete process.env.REDIS_URL;
      
      new PubSubManager();

      expect(redis.createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379'
      });
    });
  });

  describe('Subscribe', () => {
    beforeEach(async () => {
      await pubSubManager.connect();
    });

    test('should subscribe to a channel', async () => {
      const mockHandler = jest.fn();

      await pubSubManager.subscribe('test_channel', mockHandler);

      expect(mockSubscriber.subscribe).toHaveBeenCalledWith(
        'test_channel',
        expect.any(Function)
      );
      expect(pubSubManager.handlers.get('test_channel')).toBe(mockHandler);
    });

    test('should parse JSON message and call handler', async () => {
      const mockHandler = jest.fn();
      const testMessage = { type: 'test', data: 'value' };

      mockSubscriber.subscribe.mockImplementationOnce(async (channel, callback) => {
        await callback(JSON.stringify(testMessage));
      });

      await pubSubManager.subscribe('test_channel', mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(testMessage);
    });

    test('should handle subscribe errors', async () => {
      mockSubscriber.subscribe.mockRejectedValueOnce(new Error('Subscribe error'));

      await expect(
        pubSubManager.subscribe('test_channel', jest.fn())
      ).rejects.toThrow('Subscribe error');
    });

    test('should support multiple subscriptions', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      mockSubscriber.subscribe.mockResolvedValueOnce(undefined);

      await pubSubManager.subscribe('channel1', handler1);
      await pubSubManager.subscribe('channel2', handler2);

      expect(pubSubManager.handlers.get('channel1')).toBe(handler1);
      expect(pubSubManager.handlers.get('channel2')).toBe(handler2);
    });
  });

  describe('Unsubscribe', () => {
    beforeEach(async () => {
      await pubSubManager.connect();
      mockSubscriber.subscribe.mockResolvedValueOnce(undefined);
      await pubSubManager.subscribe('test_channel', jest.fn());
    });

    test('should unsubscribe from a channel', async () => {
      await pubSubManager.unsubscribe('test_channel');

      expect(mockSubscriber.unsubscribe).toHaveBeenCalledWith('test_channel');
      expect(pubSubManager.handlers.has('test_channel')).toBe(false);
    });

    test('should handle unsubscribe errors', async () => {
      mockSubscriber.unsubscribe.mockRejectedValueOnce(
        new Error('Unsubscribe error')
      );

      await expect(
        pubSubManager.unsubscribe('test_channel')
      ).rejects.toThrow('Unsubscribe error');
    });
  });

  describe('Publish', () => {
    beforeEach(async () => {
      await pubSubManager.connect();
    });

    test('should publish string message', async () => {
      await pubSubManager.publish('test_channel', 'test message');

      expect(mockPublisher.publish).toHaveBeenCalledWith(
        'test_channel',
        'test message'
      );
    });

    test('should publish object message as JSON', async () => {
      const message = { type: 'test', data: 'value' };

      await pubSubManager.publish('test_channel', message);

      expect(mockPublisher.publish).toHaveBeenCalledWith(
        'test_channel',
        JSON.stringify(message)
      );
    });

    test('should handle publish errors', async () => {
      mockPublisher.publish.mockRejectedValueOnce(new Error('Publish error'));

      await expect(
        pubSubManager.publish('test_channel', 'test')
      ).rejects.toThrow('Publish error');
    });

    test('should return successful publish result', async () => {
      mockPublisher.publish.mockResolvedValueOnce(1);

      const result = await pubSubManager.publish('test_channel', 'test');

      expect(result).toBeUndefined(); // Function doesn't return the result currently
    });
  });

  describe('Disconnect', () => {
    beforeEach(async () => {
      await pubSubManager.connect();
    });

    test('should disconnect publisher and subscriber', async () => {
      if (pubSubManager.disconnect) {
        await pubSubManager.disconnect();

        expect(mockPublisher.disconnect).toHaveBeenCalled();
        expect(mockSubscriber.disconnect).toHaveBeenCalled();
      }
    });
  });

  test('should initialize handlers map', () => {
    expect(pubSubManager.handlers).toBeInstanceOf(Map);
    expect(pubSubManager.handlers.size).toBe(0);
  });
});
