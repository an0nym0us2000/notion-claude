import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { CommentThread } from './CommentThread';

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

interface CommentSidebarProps {
  pageId: string;
  workspaceId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CommentSidebar: React.FC<CommentSidebarProps> = ({
  pageId,
  workspaceId,
  isOpen,
  onClose,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, pageId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/comments`, {
        params: { pageId },
      });

      const loadedComments = response.data.data.comments || [];
      setComments(loadedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = (comment: Comment) => {
    setComments([...comments, comment]);
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    setComments(
      comments.map((c) => (c.id === updatedComment.id ? updatedComment : c))
    );
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments(comments.filter((c) => c.id !== commentId));
  };

  // Filter comments
  const filteredComments = comments.filter((comment) => {
    if (filter === 'open') return !comment.resolved;
    if (filter === 'resolved') return comment.resolved;
    return true;
  });

  // Group comments by block
  const commentsByBlock = filteredComments.reduce((acc, comment) => {
    const blockId = comment.blockId || 'page';
    if (!acc[blockId]) {
      acc[blockId] = [];
    }
    acc[blockId].push(comment);
    return acc;
  }, {} as Record<string, Comment[]>);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-notion-border">
        {/* Header */}
        <div className="p-4 border-b border-notion-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-notion-text">
              Comments
            </h2>
            <button
              onClick={onClose}
              className="text-notion-text-secondary hover:text-notion-text-primary p-1 rounded hover:bg-notion-hover"
            >
              ✕
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 bg-notion-bg rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-white text-notion-text shadow-sm'
                  : 'text-notion-text-secondary hover:text-notion-text'
              }`}
            >
              All ({comments.length})
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filter === 'open'
                  ? 'bg-white text-notion-text shadow-sm'
                  : 'text-notion-text-secondary hover:text-notion-text'
              }`}
            >
              Open ({comments.filter((c) => !c.resolved).length})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filter === 'resolved'
                  ? 'bg-white text-notion-text shadow-sm'
                  : 'text-notion-text-secondary hover:text-notion-text'
              }`}
            >
              Resolved ({comments.filter((c) => c.resolved).length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-notion-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-notion-text-secondary font-medium mb-1">
                {filter === 'all' && 'No comments yet'}
                {filter === 'open' && 'No open comments'}
                {filter === 'resolved' && 'No resolved comments'}
              </p>
              <p className="text-xs text-notion-text-tertiary">
                {filter === 'all' && 'Select text to add a comment'}
                {filter === 'open' && 'All comments have been resolved'}
                {filter === 'resolved' && 'No comments have been resolved yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(commentsByBlock).map(([blockId, blockComments]) => (
                <div key={blockId}>
                  {/* Block Label */}
                  <div className="text-xs text-notion-text-tertiary mb-2 font-medium uppercase tracking-wide">
                    {blockId === 'page' ? 'Page Comments' : `Block ${blockId.slice(0, 8)}`}
                  </div>

                  {/* Comments */}
                  <div className="bg-notion-bg rounded-lg p-3">
                    <CommentThread
                      comments={blockComments}
                      pageId={pageId}
                      blockId={blockId === 'page' ? undefined : blockId}
                      workspaceId={workspaceId}
                      onCommentAdded={handleCommentAdded}
                      onCommentUpdated={handleCommentUpdated}
                      onCommentDeleted={handleCommentDeleted}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-notion-border bg-notion-bg">
          <div className="text-xs text-notion-text-secondary text-center">
            💡 Tip: Select text to add inline comments
          </div>
        </div>
      </div>
    </>
  );
};
