'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Post } from '@/types/database';
import { backendApi } from '@/lib/backendApi';
import PostCard from './PostCard';
import NewsCard from './NewsCard';
import CreatePost from './CreatePost';

const POSTS_PER_PAGE = 5;
const NEWS_PER_PAGE = 5;

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchPosts = async (pageNum: number) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const postsResponse = await fetch(`${backendUrl}/api/posts?page=${pageNum}&limit=${POSTS_PER_PAGE}`);
      if (!postsResponse.ok) {
        throw new Error('Failed to fetch posts');
      }
      const postsData = await postsResponse.json();
      if (!Array.isArray(postsData)) {
        console.error('Posts data is not an array:', postsData);
        return [];
      }
      return postsData;
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  };

  const fetchNews = async (pageNum: number) => {
    try {
      const newsData = await backendApi.getNews(pageNum, NEWS_PER_PAGE);
      return newsData;
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsData, newsData] = await Promise.all([
          fetchPosts(1),
          fetchNews(1)
        ]);

        setPosts(postsData);
        setNews(newsData);
        setHasMore(postsData.length > 0 || newsData.length > 0);
      } catch (error) {
        console.error('Error fetching feed:', error);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const [newPosts, newNews] = await Promise.all([
        fetchPosts(nextPage),
        fetchNews(nextPage)
      ]);

      const hasNewContent = newPosts.length > 0 || newNews.length > 0;
      
      if (hasNewContent) {
        setPosts(prev => [...prev, ...newPosts]);
        setNews(prev => [...prev, ...newNews]);
        setHasMore(newPosts.length > 0 || newNews.length > 0);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more content:', error);
      setError('Failed to load more content');
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const getInterleavedFeed = () => {
    const formattedPosts = posts.map(post => ({
      type: 'post',
      content: post,
      date: new Date(post.created_at)
    }));

    const formattedNews = news.map(article => ({
      type: 'news',
      content: article,
      date: new Date(article.published_at)
    }));

    const interleavedFeed = [];
    const maxLength = Math.max(formattedPosts.length, formattedNews.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < formattedPosts.length) {
        interleavedFeed.push(formattedPosts[i]);
      }
      if (i < formattedNews.length) {
        interleavedFeed.push(formattedNews[i]);
      }
    }

    return interleavedFeed;
  };

  const handlePostDeleted = (deletedPostId: string) => {
    setPosts(currentPosts => currentPosts.filter(post => post.postid !== deletedPostId));
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      {isAuthenticated && <CreatePost onPostCreated={() => {
        setPage(1);
        setPosts([]);
        setNews([]);
        setHasMore(true);
        fetchPosts(1).then(newPosts => setPosts(newPosts));
        fetchNews(1).then(newNews => setNews(newNews));
      }} />}
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-red-500">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8 sm:py-12">
          <div className="animate-pulse text-orange-500 text-sm sm:text-base">Loading...</div>
        </div>
      ) : (
        <>
          {getInterleavedFeed().map((item, index) => (
            <div
              key={item.type === 'post' ? `post-${item.content.postid}` : `news-${index}`}
            >
              {item.type === 'post' ? (
                <PostCard
                  post={item.content}
                  onPostUpdated={() => {
                    setPage(1);
                    setPosts([]);
                    setNews([]);
                    setHasMore(true);
                    fetchPosts(1).then(newPosts => setPosts(newPosts));
                    fetchNews(1).then(newNews => setNews(newNews));
                  }}
                  onPostDeleted={handlePostDeleted}
                />
              ) : (
                <NewsCard article={item.content} />
              )}
            </div>
          ))}
          
          {hasMore && (
            <div className="flex justify-center py-3 sm:py-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className={`px-4 py-1.5 sm:px-6 sm:py-2 text-sm sm:text-base rounded-lg font-medium transition-colors
                  ${isLoadingMore 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
              >
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
          
          {!hasMore && !isLoadingMore && posts.length > 0 && (
            <div className="text-center text-xs sm:text-sm text-gray-400 py-3 sm:py-4">
              No more content to load
            </div>
          )}
          
          {!loading && posts.length === 0 && news.length === 0 && (
            <div className="text-center text-sm sm:text-base text-gray-400 py-6 sm:py-8">
              No content available yet. Be the first to post something!
            </div>
          )}
        </>
      )}
    </div>
  );
} 