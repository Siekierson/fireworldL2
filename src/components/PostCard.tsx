'use client';

import { useState, useEffect } from 'react';
import { Post } from '@/types/database';
import { HeartIcon, ChatBubbleLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface PostCardProps {
  post: Post;
  onPostUpdated?: () => void;
  onPostDeleted?: (postId: string) => void;
}

export default function PostCard({ post, onPostUpdated, onPostDeleted }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.activities?.filter(a => a.type === 'like').length || 0);
  const [showComments, setShowComments] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserID, setCurrentUserID] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserID(decodedToken.userID);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    
    const userLiked = post.activities?.some(
      activity => activity.type === 'like' && activity.userid === currentUserID
    );
    setLiked(!!userLiked);
  }, [post.activities, currentUserID]);

  const handleDelete = async () => {
    if (!isAuthenticated || !currentUserID) {
      window.location.href = '/login';
      return;
    }

    if (isDeleting) return;

    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/posts`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ postID: post.postid })
      });

      if (response.status === 403) {
        alert('You are not authorized to delete this post');
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete post');
      }

      onPostDeleted?.(post.postid);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      console.log('Post object:', post);
      const requestBody = {
        type: 'like',
        postid: post.postid
      };
      console.log('Sending like request:', requestBody);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Like response status:', response.status);
      const responseText = await response.text();
      console.log('Like response text:', responseText);

      if (!response.ok) {
        throw new Error(`Failed to like post: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('Like response data:', data);
      
      if (data.type === 'unlike') {
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentClick = () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setShowComments(!showComments);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: 'comment',
          postid: post.postid,
          message: commentText.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const data = await response.json();
      console.log('Comment added:', data);
      
      setCommentText('');
      onPostUpdated?.();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl p-3 sm:p-4 md:p-6 shadow-lg text-black transition-all hover:bg-white max-w-full">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-1 min-w-0">
          {post.users && (
            <>
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0">
                <img
                  src={post.users?.imageurl || '/default-avatar.png'}
                  alt={post.users?.name || 'User'}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/default-avatar.png';
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base md:text-lg truncate">{post.users.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`p-1.5 sm:p-2 text-gray-500 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 flex-shrink-0 ${
            isDeleting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={currentUserID === post.ownerid ? "Delete post" : "You can't delete this post"}
        >
          <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      <p className="mb-3 sm:mb-4 text-sm sm:text-base text-gray-800 break-words">{post.text}</p>

      <div className="flex items-center space-x-4 sm:space-x-6 border-t border-gray-200 pt-3 sm:pt-4">
        <button
          onClick={handleLike}
          disabled={isLoading}
          className={`flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm transition-all duration-200 ${
            liked 
              ? 'text-red-500 hover:text-red-600' 
              : 'hover:text-orange-500'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={!isAuthenticated ? "Login to like" : ""}
        >
          {liked ? (
            <HeartSolidIcon className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
          ) : (
            <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
          <span className="font-medium">{likeCount}</span>
        </button>

        <button
          onClick={handleCommentClick}
          className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm hover:text-orange-500 transition"
          title={!isAuthenticated ? "Login to comment" : ""}
        >
          <ChatBubbleLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>{post.activities?.filter(a => a.type === 'comment').length || 0}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
          {isAuthenticated && (
            <form onSubmit={handleCommentSubmit} className="mb-3 sm:mb-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="flex-shrink-0">
                  <img
                    src={JSON.parse(atob(localStorage.getItem('token')?.split('.')[1] || '{}')).imageURL || '/default-avatar.png'}
                    alt="Your avatar"
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/default-avatar.png';
                    }}
                  />
                </div>
                <div className="flex-1 flex flex-col space-y-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder-gray-500"
                    rows={2}
                    disabled={isSubmittingComment}
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="self-end px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-2 sm:space-y-3">
            {post.activities
              ?.filter(a => a.type === 'comment')
              .map((comment, index) => {
                console.log('Comment data:', comment);
                return (
                  <div key={index} className="flex items-start space-x-2 sm:space-x-3 bg-white/50 rounded-lg p-2 sm:p-3">
                    <div className="flex-shrink-0">
                      <img
                        src={comment.users?.imageurl || '/default-avatar.png'}
                        alt={comment.users?.name || 'User'}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/default-avatar.png';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{comment.users?.name}</p>
                        <span className="text-xs text-gray-500">
                          {comment.created_at ? new Date(comment.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Invalid date'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-800 break-words mt-1">{comment.message}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
} 