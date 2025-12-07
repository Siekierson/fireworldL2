jest.mock('@/controllers/authController', () => ({
  authController: {
    verifyToken: jest.fn()
  }
}));

jest.mock('@/controllers/postController', () => ({
  postController: {
    createPost: jest.fn(),
    deletePost: jest.fn()
  }
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

import { POST, GET, DELETE } from '../route';
import { authController } from '@/controllers/authController';
import { postController } from '@/controllers/postController';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const createMockRequest = (body?: any, headers: Record<string, string> = {}, url?: string) => {
  return {
    headers: {
      get: (name: string) => headers[name] || null,
    },
    json: () => Promise.resolve(body),
    url: url || 'http://localhost:3000/api/posts',
  } as unknown as Request;
};

describe('/api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should return 401 if no token is provided', async () => {
      const request = createMockRequest({ text: 'test post' });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'No token provided' });
    });

    it('should return 400 if post text is missing', async () => {
      (authController.verifyToken as jest.Mock).mockReturnValue({ userID: 'user1' });
      const request = createMockRequest({}, { 'Authorization': 'Bearer valid-token' });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Post text is required and must be a string' });
    });

    it('should create a post with valid data', async () => {
      (authController.verifyToken as jest.Mock).mockReturnValue({ userID: 'user1' });
      const mockPost = { id: '1', text: 'test post', ownerid: 'user1' };
      (postController.createPost as jest.Mock).mockResolvedValue(mockPost);
      const request = createMockRequest({ text: 'test post' }, { 'Authorization': 'Bearer valid-token' });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toEqual(mockPost);
      expect(postController.createPost).toHaveBeenCalledWith('test post', 'user1');
    });

    it('should return 401 if token is invalid', async () => {
      (authController.verifyToken as jest.Mock).mockImplementation(() => { throw new jwt.JsonWebTokenError('Invalid token'); });
      const request = createMockRequest({ text: 'test post' }, { 'Authorization': 'Bearer invalid-token' });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error');
    });

    it('should return 500 if post creation fails', async () => {
      (authController.verifyToken as jest.Mock).mockReturnValue({ userID: 'user1' });
      (postController.createPost as jest.Mock).mockRejectedValue(new Error('DB error'));
      const request = createMockRequest({ text: 'test post' }, { 'Authorization': 'Bearer valid-token' });
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });

  describe('GET', () => {
    it('should return posts with default pagination', async () => {
      const mockPosts = [{ id: '1', text: 'test', ownerid: 'user1' }];
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({ data: mockPosts, error: null })
          })
        })
      });
      const request = createMockRequest(undefined, {}, 'http://localhost:3000/api/posts');
      const response = await GET(request);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toEqual(mockPosts);
    });

    it('should return 500 if fetching posts fails', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
          })
        })
      });
      const request = createMockRequest(undefined, {}, 'http://localhost:3000/api/posts');
      const response = await GET(request);
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });

  describe('DELETE', () => {
    it('should return 401 if no token is provided', async () => {
      const request = createMockRequest({ postID: '1' });
      const response = await DELETE(request);
      const data = await response.json();
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'No token provided' });
    });

    it('should delete a post with valid token and postID', async () => {
      (authController.verifyToken as jest.Mock).mockReturnValue({ userID: 'user1' });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { ownerid: 'user1' }, error: null })
          })
        })
      });
      (postController.deletePost as jest.Mock).mockResolvedValue(true);
      const request = createMockRequest({ postID: '1' }, { 'Authorization': 'Bearer valid-token' });
      const response = await DELETE(request);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(postController.deletePost).toHaveBeenCalledWith('1', 'user1');
    });

    it('should return 404 if post not found', async () => {
      (authController.verifyToken as jest.Mock).mockReturnValue({ userID: 'user1' });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
          })
        })
      });
      const request = createMockRequest({ postID: '1' }, { 'Authorization': 'Bearer valid-token' });
      const response = await DELETE(request);
      const data = await response.json();
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Post not found' });
    });

    it('should return 403 if user is not authorized', async () => {
      (authController.verifyToken as jest.Mock).mockReturnValue({ userID: 'user1' });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { ownerid: 'user2' }, error: null })
          })
        })
      });
      const request = createMockRequest({ postID: '1' }, { 'Authorization': 'Bearer valid-token' });
      const response = await DELETE(request);
      const data = await response.json();
      expect(response.status).toBe(403);
      expect(data).toEqual({ error: 'You are not authorized to delete this post' });
    });

    it('should return 400 if deletion fails', async () => {
      (authController.verifyToken as jest.Mock).mockReturnValue({ userID: 'user1' });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { ownerid: 'user1' }, error: null })
          })
        })
      });
      (postController.deletePost as jest.Mock).mockRejectedValue(new Error('Delete error'));
      const request = createMockRequest({ postID: '1' }, { 'Authorization': 'Bearer valid-token' });
      const response = await DELETE(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });
  });
}); 