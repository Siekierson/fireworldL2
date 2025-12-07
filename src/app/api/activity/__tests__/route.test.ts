import { GET } from '../route';
import { supabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

type MockSupabaseClient = {
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: [], error: null })
  } as unknown as MockSupabaseClient & SupabaseClient,
}));

global.Request = class Request {
  url: string;
  headers: Headers = new Headers();
  method: string = 'GET';
  body: any;

  constructor(input: string | Request, init?: RequestInit) {
    if (typeof input === 'string') {
      this.url = input;
    } else {
      this.url = input.url;
      this.headers = input.headers;
      this.method = input.method;
      this.body = input.body;
    }

    if (init) {
      this.headers = init.headers as Headers;
      this.method = init.method || 'GET';
      this.body = init.body;
    }
  }
} as any;

global.Headers = class Headers {
  private headers: Map<string, string>;

  constructor(init?: HeadersInit) {
    this.headers = new Map();
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.headers.set(key, value));
      } else if (init instanceof Headers) {
        init.forEach((value, key) => this.headers.set(key, value));
      } else {
        Object.entries(init).forEach(([key, value]) => this.headers.set(key, value));
      }
    }
  }

  get(name: string): string | null {
    return this.headers.get(name) || null;
  }

  set(name: string, value: string): void {
    this.headers.set(name, value);
  }

  has(name: string): boolean {
    return this.headers.has(name);
  }

  delete(name: string): void {
    this.headers.delete(name);
  }

  forEach(callback: (value: string, key: string) => void): void {
    this.headers.forEach((value, key) => callback(value, key));
  }
} as any;

type MockQueryBuilder = {
  select: jest.Mock;
  order: jest.Mock;
  eq: jest.Mock;
};

const createMockRequest = (postID: string) => {
  return { url: `http://localhost:3000/api/activity?postID=${postID}` } as unknown as Request;
};

describe('/api/activity', () => {
  beforeEach(() => { 
    jest.clearAllMocks();
    (supabase as unknown as MockSupabaseClient).from.mockClear();
    (supabase as unknown as MockSupabaseClient).select.mockClear();
    (supabase as unknown as MockSupabaseClient).eq.mockClear();
    (supabase as unknown as MockSupabaseClient).order.mockClear();
  });

  describe('GET', () => {
    it('should return activities for a post', async () => {
      const mockActivities = [
        { 
          activityid: '1', 
          type: 'like',
          postid: 'post1', 
          userid: 'user1', 
          created_at: '2024-01-01T00:00:00Z',
          users: { name: 'User 1', imageurl: 'url1' }
        },
        { 
          activityid: '2', 
          type: 'comment',
          postid: 'post1', 
          userid: 'user2', 
          message: 'Test comment',
          created_at: '2024-01-02T00:00:00Z',
          users: { name: 'User 2', imageurl: 'url2' }
        }
      ];

      (supabase as unknown as MockSupabaseClient).order.mockResolvedValueOnce({ data: mockActivities, error: null });

      const request = createMockRequest('post1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockActivities);
      expect((supabase as unknown as MockSupabaseClient).from).toHaveBeenCalledWith('activities');
      expect((supabase as unknown as MockSupabaseClient).select).toHaveBeenCalledWith(expect.stringContaining('activityid'));
      expect((supabase as unknown as MockSupabaseClient).eq).toHaveBeenCalledWith('postid', 'post1');
      expect((supabase as unknown as MockSupabaseClient).order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return 400 if postID is missing', async () => {
      const request = { url: 'http://localhost:3000/api/activity' } as unknown as Request;
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Post ID is required');
    });

    it('should return 400 if database query fails', async () => {
      (supabase as unknown as MockSupabaseClient).order.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Database connection failed' }
      });

      const request = createMockRequest('post1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Failed to fetch activities');
    });

    it('should return empty array for post with no activities', async () => {
      (supabase as unknown as MockSupabaseClient).order.mockResolvedValueOnce({ data: [], error: null });

      const request = createMockRequest('post1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
      expect((supabase as unknown as MockSupabaseClient).from).toHaveBeenCalledWith('activities');
      expect((supabase as unknown as MockSupabaseClient).select).toHaveBeenCalledWith(expect.stringContaining('activityid'));
      expect((supabase as unknown as MockSupabaseClient).eq).toHaveBeenCalledWith('postid', 'post1');
      expect((supabase as unknown as MockSupabaseClient).order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });
});
