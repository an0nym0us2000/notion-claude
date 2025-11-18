import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { MentionSuggestion } from './MentionSuggestion';

interface Comment {
  id: string;
  content: string;
  pageId: string;
  blockId?: string;
  parentId?: string;
  authorId: string;
  author?: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  mentions: string[];
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface CommentThreadProps {
  comments: Comment[];
  pageId: string;
  blockId?: string;
  workspaceId?: string;
  onCommentAdded?: (comment: Comment) => void;
  onCommentUpdated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  onClose?: () => void;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comments,
  pageId,
  blockId,
  workspaceId,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  onClose,
}) => {
  const { user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [activeTextarea, setActiveTextarea] = useState<'new' | 'reply' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);

      const response = await api.post('/api/comments', {
        content: newComment,
        pageId,
        blockId,
        mentions: extractMentions(newComment),
      });

      const comment = response.data.data.comment;
      onCommentAdded?.(comment);
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Failed to create comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);

      const response = await api.post('/api/comments', {
        content: replyContent,
        pageId,
        blockId,
        parentId,
        mentions: extractMentions(replyContent),
      });

      const comment = response.data.data.comment;
      onCommentAdded?.(comment);
      setReplyTo(null);
      setReplyContent('');
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('Failed to create reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (commentId: string, resolved: boolean) => {
    try {
      const response = await api.patch(`/api/comments/${commentId}`, {
        resolved,
      });

      const updated = response.data.data.comment;
      onCommentUpdated?.(updated);
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment. Please try again.');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await api.delete(`/api/comments/${commentId}`);
      onCommentDeleted?.(commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^\)]+)\)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[2]); // User ID from [@Name](userId)
    }

    return mentions;
  };

  const handleTextChange = (value: string, type: 'new' | 'reply') => {
    if (type === 'new') {
      setNewComment(value);
    } else {
      setReplyContent(value);
    }

    // Detect @ mentions
    const cursorPosition = type === 'new'
      ? textareaRef.current?.selectionStart || 0
      : replyTextareaRef.current?.selectionStart || 0;

    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Check if @ is at start or preceded by space
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if (charBeforeAt === ' ' || lastAtIndex === 0) {
        const query = textBeforeCursor.slice(lastAtIndex + 1);
        // Check if there's no space after @
        if (!query.includes(' ')) {
          setMentionQuery(query);
          setActiveTextarea(type);
          setShowMentions(true);

          // Calculate position
          const textarea = type === 'new' ? textareaRef.current : replyTextareaRef.current;
          if (textarea) {
            const rect = textarea.getBoundingClientRect();
            setMentionPosition({
              top: rect.bottom + window.scrollY + 4,
              left: rect.left + window.scrollX,
            });
          }
          return;
        }
      }
    }

    setShowMentions(false);
  };

  const handleMentionSelect = (mentionedUser: any) => {
    const mentionText = `@[${mentionedUser.name || mentionedUser.email}](${mentionedUser.id})`;

    if (activeTextarea === 'new') {
      const cursorPosition = textareaRef.current?.selectionStart || 0;
      const textBeforeCursor = newComment.slice(0, cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      const textAfterCursor = newComment.slice(cursorPosition);

      const newText = newComment.slice(0, lastAtIndex) + mentionText + ' ' + textAfterCursor;
      setNewComment(newText);
    } else if (activeTextarea === 'reply') {
      const cursorPosition = replyTextareaRef.current?.selectionStart || 0;
      const textBeforeCursor = replyContent.slice(0, cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      const textAfterCursor = replyContent.slice(cursorPosition);

      const newText = replyContent.slice(0, lastAtIndex) + mentionText + ' ' + textAfterCursor;
      setReplyContent(newText);
    }

    setShowMentions(false);
    setMentionQuery('');
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isAuthor = user?.id === comment.authorId;

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-8 mt-2' : 'mt-3'} ${
          comment.resolved ? 'opacity-60' : ''
        }`}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-notion-blue text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold">
            {comment.author?.avatar ? (
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>
                {(comment.author?.name || comment.author?.email || 'U')[0].toUpperCase()}
              </span>
            )}
          </div>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-notion-bg rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-notion-text">
                    {comment.author?.name || 'Unknown User'}
                  </span>
                  <span className="text-xs text-notion-text-tertiary">
                    {formatTimestamp(comment.createdAt)}
                  </span>
                </div>

                {isAuthor && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-notion-text-secondary hover:text-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>

              <div className="text-sm text-notion-text whitespace-pre-wrap">
                {comment.content}
              </div>
            </div>

            {/* Comment Actions */}
            <div className="flex items-center gap-3 mt-1 px-3">
              <button
                onClick={() => setReplyTo(comment.id)}
                className="text-xs text-notion-text-secondary hover:text-notion-text-primary"
              >
                Reply
              </button>

              {!isReply && !comment.resolved && (
                <button
                  onClick={() => handleResolve(comment.id, true)}
                  className="text-xs text-notion-text-secondary hover:text-green-600"
                >
                  Resolve
                </button>
              )}

              {!isReply && comment.resolved && (
                <button
                  onClick={() => handleResolve(comment.id, false)}
                  className="text-xs text-green-600 hover:text-notion-text-secondary"
                >
                  ✓ Resolved
                </button>
              )}
            </div>

            {/* Reply Form */}
            {replyTo === comment.id && (
              <div className="mt-2 ml-3">
                <textarea
                  ref={replyTextareaRef}
                  value={replyContent}
                  onChange={(e) => handleTextChange(e.target.value, 'reply')}
                  placeholder="Write a reply... (use @name to mention)"
                  className="w-full px-3 py-2 border border-notion-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-notion-blue"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={submitting || !replyContent.trim()}
                    className="px-3 py-1 text-xs bg-notion-blue text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setReplyTo(null);
                      setReplyContent('');
                    }}
                    className="px-3 py-1 text-xs border border-notion-border rounded hover:bg-notion-hover"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                {comment.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Get top-level comments (no parent)
  const topLevelComments = comments.filter((c) => !c.parentId);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-notion-border flex items-center justify-between">
        <h3 className="font-semibold text-notion-text">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-notion-text-secondary hover:text-notion-text-primary"
          >
            ✕
          </button>
        )}
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-4">
        {topLevelComments.length === 0 ? (
          <div className="text-center py-8 text-notion-text-secondary">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1">Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topLevelComments.map((comment) => renderComment(comment))}
          </div>
        )}
      </div>

      {/* New Comment Form */}
      <div className="p-4 border-t border-notion-border">
        <textarea
          ref={textareaRef}
          value={newComment}
          onChange={(e) => handleTextChange(e.target.value, 'new')}
          placeholder="Add a comment... (use @name to mention)"
          className="w-full px-3 py-2 border border-notion-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-notion-blue"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleSubmitComment}
            disabled={submitting || !newComment.trim()}
            className="px-4 py-2 bg-notion-blue text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Comment'}
          </button>
        </div>
      </div>

      {/* Mention Suggestions */}
      {showMentions && workspaceId && (
        <MentionSuggestion
          query={mentionQuery}
          workspaceId={workspaceId}
          onSelect={handleMentionSelect}
          position={mentionPosition}
        />
      )}
    </div>
  );
};
