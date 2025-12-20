import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { UserProvider, useUser } from '../../context/UserContext';
import api from '../../services/api';
import { toast } from 'react-toastify';

jest.mock('../../services/api');
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('UserContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('should provide user context', () => {
    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(result.current.globalLoading).toBeFalsy();
  });

  test('should restore user from localStorage on mount', () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
    };

    localStorage.setItem('token', 'testtoken123');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current.user).toEqual(mockUser);
  });

  test('should login successfully', async () => {
    const mockResponse = {
      data: {
        data: {
          token: 'testtoken123',
          user: {
            _id: '507f1f77bcf86cd799439011',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      },
    };

    api.post.mockResolvedValueOnce(mockResponse);

    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'password123');
    });

    expect(loginResult.success).toBe(true);
    expect(result.current.user).toEqual(mockResponse.data.data.user);
    expect(localStorage.getItem('token')).toBe('testtoken123');
    expect(toast.success).toHaveBeenCalledWith('Login successful!');
  });

  test('should handle login error', async () => {
    const errorMessage = 'Invalid credentials';
    api.post.mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    });

    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'wrongpassword');
    });

    expect(loginResult.success).toBe(false);
    expect(loginResult.error).toBe(errorMessage);
    expect(toast.error).toHaveBeenCalledWith(errorMessage);
  });

  test('should register successfully', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'User created successfully',
      },
    };

    api.post.mockResolvedValueOnce(mockResponse);

    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    const userData = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      skillsOffered: ['JavaScript'],
      skillsWanted: ['Python'],
    };

    let registerResult;
    await act(async () => {
      registerResult = await result.current.register(userData);
    });

    expect(registerResult.success).toBe(true);
    expect(toast.success).toHaveBeenCalledWith('Registration successful! Please login.');
  });

  test('should handle registration error', async () => {
    const errorMessage = 'Email already exists';
    api.post.mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    });

    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    let registerResult;
    await act(async () => {
      registerResult = await result.current.register(userData);
    });

    expect(registerResult.success).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(errorMessage);
  });

  test('should logout successfully', () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
    };

    localStorage.setItem('token', 'testtoken123');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current.user).toEqual(mockUser);

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(toast.info).toHaveBeenCalledWith('Logged out successfully');
  });

  test('should handle timeout error', async () => {
    api.post.mockRejectedValueOnce({
      code: 'ECONNABORTED',
    });

    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'password123');
    });

    expect(loginResult.success).toBe(false);
    expect(loginResult.error).toBe('Request timed out. Please try again.');
  });

  test('should call API with correct endpoint for login', async () => {
    const mockResponse = {
      data: {
        data: {
          token: 'testtoken123',
          user: {
            _id: '507f1f77bcf86cd799439011',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      },
    };

    api.post.mockResolvedValueOnce(mockResponse);

    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(api.post).toHaveBeenCalledWith('/login', {
      email: 'test@example.com',
      password: 'password123',
    });
  });

  test('should call API with correct endpoint for register', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'User created successfully',
      },
    };

    api.post.mockResolvedValueOnce(mockResponse);

    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    const userData = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      skillsOffered: ['JavaScript'],
      skillsWanted: ['Python'],
    };

    await act(async () => {
      await result.current.register(userData);
    });

    expect(api.post).toHaveBeenCalledWith('/register', userData);
  });
});
