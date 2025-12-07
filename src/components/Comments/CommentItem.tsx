import React from 'react';
import { Activity } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface CommentItemProps {
  comment: Activity;
  onLike: (commentId: string) => void;
  isLiked: boolean;
  likeCount: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onLike,
  isLiked,
  likeCount,
}) => {
  return (
    <div className="flex items-start space-x-3 bg-white/50 rounded-lg p-3">
      <div className="flex-shrink-0">
        <img
          src={comment.users?.imageurl || '/default-avatar.png'}
          alt={comment.users?.name || 'User'}
          className="w-8 h-8 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/default-avatar.png';
          }}
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-900">{comment.users?.name}</p>
          <span className="text-xs text-gray-500">
            {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : 'Invalid date'}
          </span>
        </div>
        <p className="text-sm text-gray-800">{comment.message}</p>
        <div className="mt-2 flex items-center space-x-4">
          <button
            onClick={() => onLike(comment.activityid)}
            className={`flex items-center space-x-1 text-sm transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            {isLiked ? (
              <HeartSolidIcon className="h-4 w-4" />
            ) : (
              <HeartIcon className="h-4 w-4" />
            )}
            <span>{likeCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentItem; 