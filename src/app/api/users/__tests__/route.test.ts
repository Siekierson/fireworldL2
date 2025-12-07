jest.mock('@/controllers/authController', () => ({
  authController: {
    verifyToken: jest.fn()
  }
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

import { GET } from '../route'
import { NextResponse } from 'next/server'
import { authController } from '@/controllers/authController'
import { supabase } from '@/lib/supabase'

const createMockRequest = (headers: Record<string, string> = {}) => {
  return {
    headers: {
      get: (name: string) => headers[name] || null,
    },
  } as unknown as Request
}

describe('Users API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/users', () => {
    it('powinien zwrócić 401 gdy brak tokenu', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'No token provided' })
    })

    it('powinien zwrócić listę użytkowników gdy token jest poprawny', async () => {
      const mockUser = { userID: '123' }
      const mockUsers = [
        { userid: '456', name: 'Jan Kowalski', imageurl: 'http://example.com/avatar.jpg' },
        { userid: '789', name: 'Anna Nowak', imageurl: 'http://example.com/avatar2.jpg' }
      ]

      ;(authController.verifyToken as jest.Mock).mockReturnValue(mockUser)
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockUsers,
              error: null
            })
          })
        })
      })

      const request = createMockRequest({
        'Authorization': 'Bearer valid-token'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([
        { userID: '456', name: 'Jan Kowalski', imageURL: 'http://example.com/avatar.jpg' },
        { userID: '789', name: 'Anna Nowak', imageURL: 'http://example.com/avatar2.jpg' }
      ])
      expect(authController.verifyToken).toHaveBeenCalledWith('valid-token')
    })

    it('powinien zwrócić 400 gdy wystąpi błąd podczas pobierania użytkowników', async () => {
      const mockUser = { userID: '123' }
      ;(authController.verifyToken as jest.Mock).mockReturnValue(mockUser)
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error')
            })
          })
        })
      })

      const request = createMockRequest({
        'Authorization': 'Bearer valid-token'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Failed to fetch users' })
    })
  })
}) 