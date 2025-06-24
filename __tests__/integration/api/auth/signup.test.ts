import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '@/app/api/auth/signup/route';
import { invitationRepository } from '@/lib/repositories/invitations';
import { userRepository } from '@/lib/repositories/users';
import { sendWelcomeEmail } from '@/lib/email-service';
import { NextRequest } from 'next/server';

// Mock repositories and services
jest.mock('@/lib/repositories/invitations');
jest.mock('@/lib/repositories/users');
jest.mock('@/lib/email-service');

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully create a new user with valid invitation', async () => {
    const mockInvitation = {
      id: 'inv-123',
      email: 'test@example.com',
      token: 'valid-token',
      invitedBy: 'admin-123',
      expiresAt: new Date(Date.now() + 86400000), // 1 day from now
      usedAt: null,
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'head_ta',
      gradYear: 2024,
      degreeProgram: 'Computer Science',
      currentRole: 'Software Engineer',
      linkedinUrl: 'https://linkedin.com/in/testuser',
      personalSite: 'https://testuser.com',
      location: 'St. Louis, MO',
      createdAt: new Date(),
      updatedAt: new Date(),
      invitedBy: 'admin-123',
    };

    (invitationRepository.findValidByToken as jest.Mock).mockResolvedValue(mockInvitation);
    (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (userRepository.create as jest.Mock).mockResolvedValue(mockUser);
    (invitationRepository.markAsUsed as jest.Mock).mockResolvedValue(true);
    (sendWelcomeEmail as jest.Mock).mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        email: 'test@example.com',
        password: 'ValidPass123!',
        firstName: 'Test',
        lastName: 'User',
        gradYear: '2024',
        degreeProgram: 'Computer Science',
        currentRole: 'Software Engineer',
        linkedinUrl: 'https://linkedin.com/in/testuser',
        personalSite: 'https://testuser.com',
        location: 'St. Louis, MO',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toEqual(mockUser);
    expect(data.message).toBe('Account created successfully. Please sign in.');

    expect(invitationRepository.findValidByToken).toHaveBeenCalledWith('valid-token');
    expect(userRepository.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'ValidPass123!',
      firstName: 'Test',
      lastName: 'User',
      gradYear: 2024,
      degreeProgram: 'Computer Science',
      currentRole: 'Software Engineer',
      linkedinUrl: 'https://linkedin.com/in/testuser',
      personalSite: 'https://testuser.com',
      location: 'St. Louis, MO',
      role: 'head_ta',
      invitedBy: 'admin-123',
    });
    expect(invitationRepository.markAsUsed).toHaveBeenCalledWith('inv-123');
  });

  it('should reject signup with missing required fields', async () => {
    const testCases = [
      { field: 'token', body: { email: 'test@example.com', password: 'Pass123!', firstName: 'Test', lastName: 'User' } },
      { field: 'email', body: { token: 'token', password: 'Pass123!', firstName: 'Test', lastName: 'User' } },
      { field: 'password', body: { token: 'token', email: 'test@example.com', firstName: 'Test', lastName: 'User' } },
      { field: 'first name', body: { token: 'token', email: 'test@example.com', password: 'Pass123!', lastName: 'User' } },
      { field: 'last name', body: { token: 'token', email: 'test@example.com', password: 'Pass123!', firstName: 'Test' } },
    ];

    for (const testCase of testCases) {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(testCase.body),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain(`Missing required fields`);
      expect(data.error).toContain(testCase.field);
    }
  });

  it('should reject signup with invalid email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        email: 'invalid-email',
        password: 'ValidPass123!',
        firstName: 'Test',
        lastName: 'User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Please provide a valid email address');
  });

  it('should reject signup with weak password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Password does not meet security requirements');
    expect(data.details).toContain('Password must be at least 8 characters long');
  });

  it('should reject signup with invalid invitation token', async () => {
    (invitationRepository.findValidByToken as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        token: 'invalid-token',
        email: 'test@example.com',
        password: 'ValidPass123!',
        firstName: 'Test',
        lastName: 'User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Invalid or expired invitation token. Please request a new invitation.');
    expect(data.code).toBe('INVALID_TOKEN');
  });

  it('should reject signup if email does not match invitation', async () => {
    const mockInvitation = {
      id: 'inv-123',
      email: 'invited@example.com',
      token: 'valid-token',
      invitedBy: 'admin-123',
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: null,
    };

    (invitationRepository.findValidByToken as jest.Mock).mockResolvedValue(mockInvitation);

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        email: 'different@example.com',
        password: 'ValidPass123!',
        firstName: 'Test',
        lastName: 'User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('This invitation is for invited@example.com. Please use the correct email address or request a new invitation.');
    expect(data.code).toBe('EMAIL_MISMATCH');
  });

  it('should reject signup if user already exists', async () => {
    const mockInvitation = {
      id: 'inv-123',
      email: 'test@example.com',
      token: 'valid-token',
      invitedBy: 'admin-123',
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: null,
    };

    const existingUser = {
      id: 'existing-user',
      email: 'test@example.com',
    };

    (invitationRepository.findValidByToken as jest.Mock).mockResolvedValue(mockInvitation);
    (userRepository.findByEmail as jest.Mock).mockResolvedValue(existingUser);

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        email: 'test@example.com',
        password: 'ValidPass123!',
        firstName: 'Test',
        lastName: 'User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('An account already exists with this email address. Please sign in instead.');
    expect(data.code).toBe('USER_EXISTS');
  });

  it('should handle email service failures gracefully', async () => {
    const mockInvitation = {
      id: 'inv-123',
      email: 'test@example.com',
      token: 'valid-token',
      invitedBy: 'admin-123',
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: null,
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'head_ta',
    };

    (invitationRepository.findValidByToken as jest.Mock).mockResolvedValue(mockInvitation);
    (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (userRepository.create as jest.Mock).mockResolvedValue(mockUser);
    (invitationRepository.markAsUsed as jest.Mock).mockResolvedValue(true);
    (sendWelcomeEmail as jest.Mock).mockResolvedValue({ success: false, error: 'Email service error' });

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        email: 'test@example.com',
        password: 'ValidPass123!',
        firstName: 'Test',
        lastName: 'User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Should still succeed even if email fails
    expect(response.status).toBe(201);
    expect(data.data).toEqual(mockUser);
  });

  it('should handle case-insensitive email comparison', async () => {
    const mockInvitation = {
      id: 'inv-123',
      email: 'Test@Example.COM',
      token: 'valid-token',
      invitedBy: 'admin-123',
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: null,
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'head_ta',
    };

    (invitationRepository.findValidByToken as jest.Mock).mockResolvedValue(mockInvitation);
    (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (userRepository.create as jest.Mock).mockResolvedValue(mockUser);
    (invitationRepository.markAsUsed as jest.Mock).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        email: 'test@example.com',
        password: 'ValidPass123!',
        firstName: 'Test',
        lastName: 'User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toEqual(mockUser);
  });
});