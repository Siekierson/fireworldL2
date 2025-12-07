jest.mock('openai', () => {
  const mockCreate = jest.fn();
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

import { POST } from '../route';
import OpenAI from 'openai';

const getMockCreate = () => {
  const instance = new OpenAI({ apiKey: 'test' });
  return (instance.chat.completions as any).create;
};

const createMockRequest = (body: any) => {
  return {
    json: () => Promise.resolve(body),
  } as unknown as Request;
};

describe('/api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a message from OpenAI', async () => {
    const mockMessage = 'Hello from AI!';
    const mockCreate = getMockCreate();
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: mockMessage } }],
    });

    const request = createMockRequest({ message: 'Hi!' });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toEqual({ message: mockMessage });
  });

  it('should return 500 if OpenAI call fails', async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockRejectedValue(new Error('OpenAI error'));
    const request = createMockRequest({ message: 'Hi!' });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
  });
}); 