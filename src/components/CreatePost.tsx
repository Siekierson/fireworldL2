'use client';

import { useState } from 'react';
import { Post } from '@/types/database';

interface CreatePostProps {
  onPostCreated: (post: Post) => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to create a post');
      }

      console.log('Token:', token);
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      console.log('Decoded token:', decodedToken);
      console.log('User ID from token:', decodedToken.userID);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      onPostCreated(data);
      setText('');
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-md rounded-xl p-3 sm:p-4 md:p-6 shadow-lg">
      <div className="mb-3 sm:mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full h-20 sm:h-24 p-3 sm:p-4 text-sm sm:text-base bg-white/50 rounded-lg text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none transition"
          maxLength={500}
        />
        <div className="flex justify-end mt-1 sm:mt-2">
          <span className="text-xs sm:text-sm text-gray-600">
            {text.length}/500
          </span>
        </div>
      </div>
      {error && (
        <div className="mb-3 sm:mb-4 text-red-500 text-xs sm:text-sm">
          {error}
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="px-4 py-1.5 sm:px-6 sm:py-2 text-sm sm:text-base bg-gradient-to-r from-orange-500 to-red-600 rounded-lg text-white font-semibold hover:from-orange-600 hover:to-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="hidden sm:inline">Posting...</span>
              <span className="sm:hidden">...</span>
            </span>
          ) : (
            'Post'
          )}
        </button>
      </div>
    </form>
  );
} 