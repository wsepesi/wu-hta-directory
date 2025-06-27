import '@testing-library/jest-dom';
import { loadEnvConfig } from '@next/env';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Polyfill Request/Response for Node.js environment
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(public url: string, public init?: RequestInit) {}
  } as any;
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(public body: any, public init?: ResponseInit) {}
    json() { return Promise.resolve(this.body); }
    text() { return Promise.resolve(String(this.body)); }
  } as any;
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    private headers: Record<string, string> = {};
    
    constructor(init?: HeadersInit) {
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.set(key, value));
        } else if (init instanceof Headers) {
          // Copy from another Headers instance
        } else {
          Object.entries(init).forEach(([key, value]) => this.set(key, value));
        }
      }
    }
    
    set(key: string, value: string) { this.headers[key.toLowerCase()] = value; }
    get(key: string) { return this.headers[key.toLowerCase()]; }
    has(key: string) { return key.toLowerCase() in this.headers; }
    delete(key: string) { delete this.headers[key.toLowerCase()]; }
  } as any;
}

// Load environment variables
loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test',
  redirect: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock fetch for client-side requests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers(),
  } as Response)
);

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Only log actual errors, not expected ones
    if (!args[0]?.includes?.('Warning:') && !args[0]?.includes?.('Error:')) {
      originalError(...args);
    }
  });
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});