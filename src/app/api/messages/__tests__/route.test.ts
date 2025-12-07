jest.mock('@/controllers/authController', () => ({
  authController: {
    verifyToken: jest.fn()
  }
}));

jest.mock('@/controllers/messageController', () => ({
  messageController: {
    sendMessage: jest.fn(),
    getMessages: jest.fn()
  }
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

import { POST, GET } from '../route'
import { authController } from '@/controllers/authController'
import { messageController } from '@/controllers/messageController'

const createMockRequest = (body?: any, headers: Record<string, string> = {}, url?: string) => {
  return {
    headers: {
      get: (name: string) => headers[name] || null,
    },
    json: () => Promise.resolve(body),
    url: url || 'http://localhost:3000/api/messages',
  } as unknown as Request
}

describe('Messages API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/messages (wysyłanie wiadomości)', () => {
    it('powinien zwrócić 401 gdy brak tokenu', async () => {
      const request = createMockRequest()
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'No token provided' })
    })

    it('powinien zwrócić 400 gdy brakuje wymaganych pól', async () => {
      const request = createMockRequest(
        { message: 'test' },
        { 'Authorization': 'Bearer valid-token' }
      )
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Message and recipient ID are required' })
    })

    it('powinien wysłać wiadomość gdy dane są poprawne', async () => {
      const mockMessage = {
        id: '123',
        message: 'Test message',
        fromWhoID: 'user1',
        toWhoID: 'user2',
        createdAt: new Date().toISOString()
      }
      ;(authController.verifyToken as jest.Mock).mockReturnValue({ userID: 'user1' })
      ;(messageController.sendMessage as jest.Mock).mockResolvedValue(mockMessage)

      const request = createMockRequest(
        {
          message: 'Test message',
          toWhoID: 'user2'
        },
        { 'Authorization': 'Bearer valid-token' }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockMessage)
      expect(messageController.sendMessage).toHaveBeenCalledWith(
        'user1',
        'Test message',
        'user2',
        'valid-token'
      )
    })

    it('powinien zwrócić 400 gdy wysyłanie wiadomości się nie powiedzie', async () => {
      ;(authController.verifyToken as jest.Mock).mockReturnValue({ userID: 'user1' })
      ;(messageController.sendMessage as jest.Mock).mockRejectedValue(new Error('Failed to send message'))

      const request = createMockRequest(
        {
          message: 'Test message',
          toWhoID: 'user2'
        },
        { 'Authorization': 'Bearer valid-token' }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Failed to send message' })
    })

    it('powinien zwrócić 401 gdy token jest nieprawidłowy', async () => {
      ;(authController.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const request = createMockRequest(
        {
          message: 'Test message',
          toWhoID: 'user2'
        },
        { 'Authorization': 'Bearer invalid-token' }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Invalid token' })
    })
  })

  describe('GET /api/messages (pobieranie wiadomości)', () => {
    it('powinien zwrócić 401 gdy brak tokenu', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'No token provided' })
    })

    it('powinien zwrócić 400 gdy brak ID drugiego użytkownika', async () => {
      (authController.verifyToken as jest.Mock).mockReturnValue({ userID: 'user1' });
      const request = createMockRequest(
        undefined,
        { 'Authorization': 'Bearer valid-token' },
        'http://localhost:3000/api/messages'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Other user ID is required' });
    })

    it('powinien pobrać wiadomości gdy dane są poprawne', async () => {
      const mockMessages = [
        {
          id: '123',
          message: 'Test message 1',
          fromWhoID: 'user1',
          toWhoID: 'user2',
          createdAt: new Date().toISOString()
        },
        {
          id: '124',
          message: 'Test message 2',
          fromWhoID: 'user2',
          toWhoID: 'user1',
          createdAt: new Date().toISOString()
        }
      ]
      ;(authController.verifyToken as jest.Mock).mockReturnValue({ userID: 'user1' })
      ;(messageController.getMessages as jest.Mock).mockResolvedValue(mockMessages)

      const request = createMockRequest(
        undefined,
        { 'Authorization': 'Bearer valid-token' },
        'http://localhost:3000/api/messages?otherUserID=user2'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockMessages)
      expect(messageController.getMessages).toHaveBeenCalledWith(
        'user1',
        'user2',
        'valid-token'
      )
    })

    it('powinien zwrócić 400 gdy pobieranie wiadomości się nie powiedzie', async () => {
      ;(authController.verifyToken as jest.Mock).mockReturnValue({ userID: 'user1' })
      ;(messageController.getMessages as jest.Mock).mockRejectedValue(new Error('Failed to fetch messages'))

      const request = createMockRequest(
        undefined,
        { 'Authorization': 'Bearer valid-token' },
        'http://localhost:3000/api/messages?otherUserID=user2'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Failed to fetch messages' })
    })

    it('powinien zwrócić 401 gdy token jest nieprawidłowy', async () => {
      ;(authController.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const request = createMockRequest(
        undefined,
        { 'Authorization': 'Bearer invalid-token' },
        'http://localhost:3000/api/messages?otherUserID=user2'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Invalid token' })
    })
  })
}) 