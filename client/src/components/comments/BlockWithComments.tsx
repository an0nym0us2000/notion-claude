import React, { useState, useEffect } from 'react';
import type { Block } from '@/lib/types';
import { InlineCommentButton } from './InlineCommentButton';
import { InlineCommentHighlight, CommentHighlight } from './InlineCommentHighlight';
import { api } from '@/lib/api';

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

interface BlockWithCommentsProps {
  block: Block;
  children: React.ReactNode;
  pageId: string;
}

export const BlockWithComments: React.FC<BlockWithCommentsProps> = ({
  block,
  children,
  pageId,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [highlights, setHighlights] = useState<CommentHighlight[]>([]);
  const [showCommentButton, setShowCommentButton] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load comments for this block
  useEffect(() => {
    loadComments();
  }, [block.id]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/comments`, {
        params: {
          pageId,
          blockId: block.id,
        },
      });

      const loadedComments = response.data.data.comments || [];
      setComments(loadedComments);

      // TODO: Load highlights from block metadata
      // For now, we'll generate highlights based on existing comments
      const blockHighlights: CommentHighlight[] = [];
      loadedComments.forEach((comment: Comment) => {
        if (!comment.parentId) {
          // Top-level comments get a highlight
          // In a real implementation, we'd store the text position
          // For now, just create a placeholder
          const existingHighlight = blockHighlights.find(
            (h) => h.commentIds.includes(comment.id)
          );
          if (!existingHighlight) {
            blockHighlights.push({
              id: `highlight-${comment.id}`,
              startOffset: 0,
              endOffset: 0,
              commentIds: [comment.id],
            });
          }
        }
      });

      setHighlights(blockHighlights);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    try {
      // Get selection range within the block
      const range = selection.getRangeAt(0);

      // Calculate offsets
      // This is a simplified version - in production, you'd need more robust offset calculation
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;

      // Create a new comment
      const response = await api.post('/api/comments', {
        content: `Comment on: "${selectedText}"`,
        pageId,
        blockId: block.id,
        mentions: [],
      });

      const newComment = response.data.data.comment;

      // Create a new highlight
      const newHighlight: CommentHighlight = {
        id: `highlight-${newComment.id}`,
        startOffset,
        endOffset,
        commentIds: [newComment.id],
      };

      setHighlights([...highlights, newHighlight]);
      setComments([...comments, newComment]);

      // Clear selection
      selection.removeAllRanges();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
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

    // Remove highlight if no more comments
    setHighlights(
      highlights.filter((h) => !h.commentIds.includes(commentId))
    );
  };

  return (
    <div className="relative">
      {/* Original block content */}
      <div className="block-content">{children}</div>

      {/* Inline comment button */}
      <InlineCommentButton onAddComment={handleAddComment} />

      {/* Comment count badge */}
      {comments.length > 0 && (
        <div className="absolute -right-2 -top-2 bg-notion-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-sm">
          {comments.length}
        </div>
      )}
    </div>
  );
};
