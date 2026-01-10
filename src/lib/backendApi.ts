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
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.details || 'Failed to get chat response';
      throw new Error(errorMessage);
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


