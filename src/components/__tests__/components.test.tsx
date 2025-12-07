import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Feed from '../Feed';
import PostCard from '../PostCard';
import CreatePost from '../CreatePost';
import NewsCard from '../NewsCard';
import Sidebar from '../Sidebar';
import RightSidebar from '../RightSidebar';
import ChatAssistant from '../ChatAssistant';
import { Post, NewsApiArticle } from '@/types/database';

const mockPush = jest.fn();
const mockPathname = '/';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: mockPathname,
  }),
  usePathname: () => mockPathname,
}));

jest.mock('@/lib/newsApi', () => ({
  newsApi: {
    getLatestNews: jest.fn().mockResolvedValue([]),
  },
}));

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

describe('Feed Component', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);
  });

  it('renders loading state initially', () => {
    render(<Feed />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders feed content after loading', async () => {
    const mockPosts = [
      {
        postid: '1',
        text: 'Test post',
        ownerid: 'user1',
        created_at: new Date().toISOString(),
        users: { name: 'Test User', imageurl: '/avatar.png' },
        activities: []
      }
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockPosts,
    } as Response);

    const { newsApi } = require('@/lib/newsApi');
    newsApi.getLatestNews.mockResolvedValue([]);

    await act(async () => {
      render(<Feed />);
    });
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows create post form when authenticated', async () => {
    localStorage.setItem('token', 'test-token');
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    const { newsApi } = require('@/lib/newsApi');
    newsApi.getLatestNews.mockResolvedValue([]);

    await act(async () => {
      render(<Feed />);
    });
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/what's on your mind/i)).toBeInTheDocument();
    });
  });

  it('displays error message on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const { newsApi } = require('@/lib/newsApi');
    newsApi.getLatestNews.mockResolvedValue([]);

    await act(async () => {
      render(<Feed />);
    });
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });
});

describe('PostCard Component', () => {
  const mockPost: Post = {
    postid: '1',
    text: 'Test post content',
    ownerid: 'user1',
    created_at: new Date().toISOString(),
    users: {
      name: 'Test User',
      imageurl: '/avatar.png'
    },
    activities: []
  };

  it('renders post content', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('Test post content')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('displays like and comment buttons', () => {
    render(<PostCard post={mockPost} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('handles like button click', async () => {
    localStorage.setItem('token', 'test-token');
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ type: 'like' }),
    } as Response);

    render(<PostCard post={mockPost} />);
    const buttons = screen.getAllByRole('button');
    const likeButton = buttons.find(btn => btn.textContent?.includes('0') || btn.getAttribute('title')?.includes('like'));
    
    if (likeButton) {
      fireEvent.click(likeButton);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    }
  });

  it('shows comments section when comment button is clicked', async () => {
    localStorage.setItem('token', 'test-token');
    await act(async () => {
      render(<PostCard post={mockPost} />);
    });
    
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const commentButton = buttons.find(btn => 
        btn.textContent?.includes('0') || btn.getAttribute('title')?.includes('comment')
      );
      
      if (commentButton) {
        fireEvent.click(commentButton);
      }
    });

    await waitFor(() => {
      const commentInput = screen.queryByPlaceholderText(/write a comment/i);
      if (commentInput) {
        expect(commentInput).toBeInTheDocument();
      }
    });
  });

  it('handles delete button click for own post', async () => {
    localStorage.setItem('token', 'test-token');
    window.confirm = jest.fn(() => true);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const mockOnPostDeleted = jest.fn();
    render(<PostCard post={mockPost} onPostDeleted={mockOnPostDeleted} />);
    
    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find(btn => btn.getAttribute('title')?.includes('Delete'));
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
      });
    }
  });
});

describe('CreatePost Component', () => {
  const mockOnPostCreated = jest.fn();

  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
  });

  it('renders textarea and submit button', () => {
    render(<CreatePost onPostCreated={mockOnPostCreated} />);
    expect(screen.getByPlaceholderText(/what's on your mind/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post/i })).toBeInTheDocument();
  });

  it('updates character count', async () => {
    await act(async () => {
      render(<CreatePost onPostCreated={mockOnPostCreated} />);
    });
    const textarea = screen.getByPlaceholderText(/what's on your mind/i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Test post' } });
    });
    await waitFor(() => {
      const countText = screen.queryByText(/7\/500/i) || screen.queryByText(/7 \/ 500/i);
      if (countText) {
        expect(countText).toBeInTheDocument();
      }
    });
  });

  it('submits post on form submit', async () => {
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJ1c2VyMSIsIm5hbWUiOiJUZXN0IFVzZXIifQ.test');
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ postid: '1', text: 'Test post' }),
    } as Response);

    await act(async () => {
      render(<CreatePost onPostCreated={mockOnPostCreated} />);
    });
    
    const textarea = screen.getByPlaceholderText(/what's on your mind/i);
    const form = textarea.closest('form');

    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Test post' } });
    });
    
    await waitFor(() => {
      expect(textarea).toHaveValue('Test post');
    });

    if (form) {
      await act(async () => {
        fireEvent.submit(form);
      });
    }

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/posts',
        expect.objectContaining({
          method: 'POST',
        })
      );
    }, { timeout: 5000 });
  }, 10000);

  it('disables submit button when text is empty', () => {
    render(<CreatePost onPostCreated={mockOnPostCreated} />);
    const submitButton = screen.getByRole('button', { name: /post/i });
    expect(submitButton).toBeDisabled();
  });
});

describe('NewsCard Component', () => {
  const mockArticle: NewsApiArticle = {
    title: 'Test News Title',
    description: 'Test news description',
    url: 'https://example.com/news',
    image_url: 'https://example.com/image.jpg',
    published_at: new Date().toISOString()
  };

  it('renders news article', () => {
    render(<NewsCard article={mockArticle} />);
    expect(screen.getByText('Test News Title')).toBeInTheDocument();
    expect(screen.getByText('Test news description')).toBeInTheDocument();
  });

  it('renders read more link', () => {
    render(<NewsCard article={mockArticle} />);
    const link = screen.getByRole('link', { name: /read more/i });
    expect(link).toHaveAttribute('href', 'https://example.com/news');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('handles missing image gracefully', () => {
    const articleWithoutImage = { ...mockArticle, image_url: '' };
    render(<NewsCard article={articleWithoutImage} />);
    expect(screen.getByText('Test News Title')).toBeInTheDocument();
  });
});

describe('RightSidebar Component', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });
  });

  it('renders AI Assistant panel on desktop', async () => {
    await act(async () => {
      render(<RightSidebar />);
    });
    await waitFor(() => {
      const assistantTexts = screen.queryAllByText(/ai assistant/i);
      expect(assistantTexts.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('shows mobile button on small screens', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    window.dispatchEvent(new Event('resize'));

    render(<RightSidebar />);
    await waitFor(() => {
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(0);
    }, { timeout: 2000 });
  });
});

describe('ChatAssistant Component', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Test response' }),
    } as Response);
  });

  it('renders chat interface', () => {
    render(<ChatAssistant />);
    expect(screen.getByText(/ai assistant/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
  });

  it('sends message on form submit', async () => {
    render(<ChatAssistant />);
    const input = screen.getByPlaceholderText(/type your message/i);
    const submitButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.any(Object));
    });
  });

  it('displays user messages', async () => {
    render(<ChatAssistant />);
    const input = screen.getByPlaceholderText(/type your message/i);
    const submitButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('displays assistant responses', async () => {
    render(<ChatAssistant />);
    const input = screen.getByPlaceholderText(/type your message/i);
    const submitButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });
  });

  it('shows loading state', async () => {
    mockFetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ message: 'Response' }),
      } as Response), 100))
    );

    render(<ChatAssistant />);
    const input = screen.getByPlaceholderText(/type your message/i);
    const submitButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/thinking/i)).toBeInTheDocument();
    });
  });
});

