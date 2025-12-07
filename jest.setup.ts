import '@testing-library/jest-dom';

// Wycisz console.error dla testów, które celowo testują scenariusze błędów
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Sprawdź wszystkie argumenty, nie tylko pierwszy
    const message = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message;
      return String(arg);
    }).join(' ');
    // Wycisz tylko oczekiwane błędy z testów
    if (
      message.includes('Error fetching') ||
      message.includes('Error decoding token') ||
      message.includes('Error in POST') ||
      message.includes('Error in GET') ||
      message.includes('Error in DELETE') ||
      message.includes('Error sending message') ||
      message.includes('Error fetching users') ||
      message.includes('Error fetching activities') ||
      message.includes('Database connection failed') ||
      message.includes('Database error') ||
      message.includes('DB error') ||
      message.includes('Delete error') ||
      message.includes('Failed to send message') ||
      message.includes('Invalid token') ||
      message.includes('Network error') ||
      message.includes('Registration API error') ||
      message.includes('User already exists') ||
      message.includes('OpenAI error') ||
      message.includes('Warning: An update to') ||
      message.includes('was not wrapped in act')
    ) {
      return;
    }
    // Wyświetl inne błędy
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    url: string;
    method: string;
    headers: Headers;
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
        this.headers = init.headers as Headers || new Headers();
        this.method = init.method || 'GET';
        this.body = init.body;
      } else {
        this.headers = new Headers();
        this.method = 'GET';
      }
    }
  } as any;
}

if (typeof global.Headers === 'undefined') {
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
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    status: number;
    statusText: string;
    headers: Headers;
    body: any;
    ok: boolean;

    constructor(body?: any, init?: ResponseInit) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = (init?.headers as Headers) || new Headers();
      this.ok = this.status >= 200 && this.status < 300;
    }

    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }

    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }
  } as any;
}

if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({}),
      text: async () => '',
      headers: new Headers(),
    } as Response)
  ) as any;
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
}));

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
}));

jest.mock('@/controllers/authController', () => ({
  authController: {
    verifyToken: jest.fn(),
    register: jest.fn(),
    login: jest.fn(),
  },
}));

jest.mock('@/controllers/messageController', () => ({
  messageController: {
    sendMessage: jest.fn(),
    getMessages: jest.fn(),
  },
}));

jest.mock('@/controllers/postController', () => ({
  postController: {
    createPost: jest.fn(),
    deletePost: jest.fn(),
    getPosts: jest.fn(),
  },
}));
