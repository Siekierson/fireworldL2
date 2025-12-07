import axios from 'axios';
import { NewsApiArticle } from '@/types/database';

const API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY;
const BASE_URL = 'https://api.thenewsapi.com/v1/news/top';

if (!API_KEY) {
  console.error('NEWS_API_KEY is not set in environment variables');
}

export const newsApi = {
  async getLatestNews(page: number = 1, limit: number = 5): Promise<NewsApiArticle[]> {
    try {
      if (!API_KEY) {
        console.error('API_KEY is undefined or empty');
        throw new Error('NEWS_API_KEY is not configured');
      }

      console.log('Making request to:', BASE_URL);
      console.log('With API key:', API_KEY ? 'Key is set' : 'Key is NOT set');

      const response = await axios.get(BASE_URL, {
        params: {
          api_token: API_KEY,
          locale: 'pl',
          limit,
          page,
          language: 'pl'
        }
      });

      console.log('Full API response:', response);

      if (!response.data) {
        console.error('No data in response');
        return [];
      }

      let newsData = response.data.data || response.data.articles || response.data;
      
      if (!Array.isArray(newsData)) {
        console.error('News data is not an array:', newsData);
        return [];
      }

      const transformedData = newsData.map((item: any) => ({
        title: item.title || item.headline || '',
        description: item.description || item.summary || '',
        url: item.url || item.link || '',
        image_url: item.image_url || item.urlToImage || '',
        published_at: item.published_at || item.publishedAt || new Date().toISOString()
      }));

      console.log('Transformed news data:', transformedData);
      return transformedData;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('News API error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          config: {
            url: error.config?.url,
            params: error.config?.params
          }
        });
      } else {
        console.error('Error fetching news:', error);
      }
      return [];
    }
  }
}; 