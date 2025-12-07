jest.mock('@/controllers/authController', () => ({
  authController: {
    register: jest.fn(),
    login: jest.fn(),
    verifyToken: jest.fn()
  }
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

import { POST, PUT, GET } from '../route';
import { authController } from '@/controllers/authController';

const createMockRequest = (body?: any, headers: Record<string, string> = {}) => {
  return {
    headers: {
      get: (name: string) => headers[name] || null,
    },
    json: () => Promise.resolve(body),
  } as unknown as Request;
};

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth (rejestracja)', () => {
    it('powinien zwrócić 400 gdy brakuje wymaganych pól', async () => {
      const request = createMockRequest({ name: 'test' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Name and password are required' });
    });

    it('powinien zarejestrować użytkownika gdy dane są poprawne', async () => {
      const mockUser = { userID: '123', name: 'test', token: 'valid-token' };
      (authController.register as jest.Mock).mockResolvedValueOnce(mockUser);

      const request = createMockRequest({
        name: 'test',
        password: 'password123'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUser);
      expect(authController.register).toHaveBeenCalledWith('test', 'password123');
    });

    it('powinien zwrócić 400 gdy rejestracja się nie powiedzie', async () => {
      (authController.register as jest.Mock).mockRejectedValueOnce(new Error('User already exists'));

      const request = createMockRequest({
        name: 'test',
        password: 'password123'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'User already exists' });
    });
  });

  describe('PUT /api/auth (logowanie)', () => {
    it('powinien zalogować użytkownika gdy dane są poprawne', async () => {
      const mockUser = { userID: '123', name: 'test', token: 'valid-token' };
      (authController.login as jest.Mock).mockResolvedValueOnce(mockUser);

      const request = createMockRequest({
        name: 'test',
        password: 'password123'
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUser);
      expect(authController.login).toHaveBeenCalledWith('test', 'password123');
    });

    it('powinien zwrócić 401 gdy logowanie się nie powiedzie', async () => {
      (authController.login as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

      const request = createMockRequest({
        name: 'test',
        password: 'wrong-password'
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Login failed' });
    });
  });

  describe('GET /api/auth (weryfikacja tokenu)', () => {
    it('powinien zwrócić 401 gdy brak tokenu', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'No token provided' });
    });

    it('powinien zweryfikować token i zwrócić dane użytkownika', async () => {
      const mockUser = { userID: '123', name: 'test' };
      (authController.verifyToken as jest.Mock).mockReturnValueOnce(mockUser);

      const request = createMockRequest(undefined, {
        'Authorization': 'Bearer valid-token'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUser);
      expect(authController.verifyToken).toHaveBeenCalledWith('valid-token');
    });

    it('powinien zwrócić 401 gdy token jest nieprawidłowy', async () => {
      (authController.verifyToken as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const request = createMockRequest(undefined, {
        'Authorization': 'Bearer invalid-token'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Invalid token' });
    });
  });
}); 