global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Headers(options.headers || {});
    this.body = options.body;
  }
}

global.Headers = class Headers {
  constructor(init = {}) {
    this.headers = new Map();
    Object.entries(init).forEach(([key, value]) => {
      this.headers.set(key.toLowerCase(), value);
    });
  }

  get(name) {
    return this.headers.get(name.toLowerCase());
  }

  set(name, value) {
    this.headers.set(name.toLowerCase(), value);
  }

  has(name) {
    return this.headers.has(name.toLowerCase());
  }
}

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => {
      const response = {
        json: () => Promise.resolve(data),
        status: options.status || 200,
        headers: new Headers(options.headers || {}),
      };
      return response;
    }),
  },
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        neq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
  },
}))

jest.mock('@/controllers/authController', () => ({
  authController: {
    verifyToken: jest.fn(),
    register: jest.fn(),
    login: jest.fn(),
  },
}))

jest.mock('@/controllers/messageController', () => ({
  messageController: {
    sendMessage: jest.fn(),
    getMessages: jest.fn(),
  },
}))

jest.mock('@/controllers/postController', () => ({
  postController: {
    createPost: jest.fn(),
    deletePost: jest.fn(),
    getPosts: jest.fn(),
  },
})) 