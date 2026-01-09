const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const backendApi = {
  async chat(message: string) {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Failed to get chat response');
    }

    return response.json();
  },

  async getNews(page: number = 1, limit: number = 5) {
    const response = await fetch(`${BACKEND_URL}/api/news?page=${page}&limit=${limit}`);

    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }

    return response.json();
  },
};

