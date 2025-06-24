import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '@/app/api/invitations/validate/route';
import { invitationRepository } from '@/lib/repositories/invitations';
import { NextRequest } from 'next/server';

// Mock repository
jest.mock('@/lib/repositories/invitations');

describe('POST /api/invitations/validate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate a valid invitation token', async () => {
    const mockInvitation = {
      id: 'inv-123',
      email: 'test@example.com',
      token: 'valid-token',
      invitedBy: 'admin-123',
      expiresAt: new Date(Date.now() + 86400000), // 1 day from now
      usedAt: null,
      createdAt: new Date(),
    };

    (invitationRepository.findByToken as jest.Mock).mockResolvedValue(mockInvitation);

    const request = new NextRequest('http://localhost:3000/api/invitations/validate', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual({
      isValid: true,
      email: 'test@example.com',
      expiresAt: mockInvitation.expiresAt.toISOString(),
    });
  });

  it('should reject request without token', async () => {
    const request = new NextRequest('http://localhost:3000/api/invitations/validate', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invitation token is required');
  });

  it('should reject invalid invitation token', async () => {
    (invitationRepository.findByToken as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/invitations/validate', {
      method: 'POST',
      body: JSON.stringify({ token: 'invalid-token' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Invalid invitation token');
    expect(data.data).toEqual({ isValid: false });
  });

  it('should reject expired invitation', async () => {
    const mockInvitation = {
      id: 'inv-123',
      email: 'test@example.com',
      token: 'expired-token',
      invitedBy: 'admin-123',
      expiresAt: new Date(Date.now() - 86400000), // 1 day ago
      usedAt: null,
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
    };

    (invitationRepository.findByToken as jest.Mock).mockResolvedValue(mockInvitation);

    const request = new NextRequest('http://localhost:3000/api/invitations/validate', {
      method: 'POST',
      body: JSON.stringify({ token: 'expired-token' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('This invitation has expired');
    expect(data.data).toEqual({ isValid: false });
  });

  it('should reject already used invitation', async () => {
    const mockInvitation = {
      id: 'inv-123',
      email: 'test@example.com',
      token: 'used-token',
      invitedBy: 'admin-123',
      expiresAt: new Date(Date.now() + 86400000), // Still valid
      usedAt: new Date(Date.now() - 3600000), // Used 1 hour ago
      createdAt: new Date(Date.now() - 172800000),
    };

    (invitationRepository.findByToken as jest.Mock).mockResolvedValue(mockInvitation);

    const request = new NextRequest('http://localhost:3000/api/invitations/validate', {
      method: 'POST',
      body: JSON.stringify({ token: 'used-token' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('This invitation has already been used');
    expect(data.data).toEqual({ isValid: false });
  });

  it('should handle repository errors gracefully', async () => {
    (invitationRepository.findByToken as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/invitations/validate', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to validate invitation');
  });

  it('should handle JSON parsing errors', async () => {
    const request = new NextRequest('http://localhost:3000/api/invitations/validate', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to validate invitation');
  });

  it('should trim whitespace from token', async () => {
    const mockInvitation = {
      id: 'inv-123',
      email: 'test@example.com',
      token: 'valid-token',
      invitedBy: 'admin-123',
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: null,
      createdAt: new Date(),
    };

    (invitationRepository.findByToken as jest.Mock).mockResolvedValue(mockInvitation);

    const request = new NextRequest('http://localhost:3000/api/invitations/validate', {
      method: 'POST',
      body: JSON.stringify({ token: '  valid-token  ' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(invitationRepository.findByToken).toHaveBeenCalledWith('valid-token');
  });
});