import React from 'react';
import { Activity } from '@/types/database';
import CommentItem from './CommentItem';

interface CommentListProps {
  comments: Activity[];
  currentUserId: string;
  onLike: (commentId: string) => void;
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  currentUserId,
  onLike,
}) => {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.activityid}
          comment={comment}
          onLike={onLike}
          isLiked={comment.userid === currentUserId}
          likeCount={0}
        />
      ))}
    </div>
  );
};

export default CommentList; 