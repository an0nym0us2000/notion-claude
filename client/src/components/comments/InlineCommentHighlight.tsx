import React, { useState } from 'react';
import { CommentThread } from './CommentThread';

export interface CommentHighlight {
  id: string;
  startOffset: number;
  endOffset: number;
  commentIds: string[];
}

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

interface InlineCommentHighlightProps {
  text: string;
  highlights: CommentHighlight[];
  comments: Comment[];
  pageId: string;
  blockId: string;
  onCommentAdded?: (comment: Comment) => void;
  onCommentUpdated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
}

export const InlineCommentHighlight: React.FC<InlineCommentHighlightProps> = ({
  text,
  highlights,
  comments,
  pageId,
  blockId,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
}) => {
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [threadPosition, setThreadPosition] = useState<{ top: number; left: number } | null>(null);

  if (highlights.length === 0) {
    return <span>{text}</span>;
  }

  // Sort highlights by start offset
  const sortedHighlights = [...highlights].sort((a, b) => a.startOffset - b.startOffset);

  // Build segments of text with highlights
  const segments: Array<{
    text: string;
    highlight?: CommentHighlight;
  }> = [];

  let currentIndex = 0;

  sortedHighlights.forEach((highlight) => {
    // Add text before highlight
    if (currentIndex < highlight.startOffset) {
      segments.push({
        text: text.slice(currentIndex, highlight.startOffset),
      });
    }

    // Add highlighted text
    segments.push({
      text: text.slice(highlight.startOffset, highlight.endOffset),
      highlight,
    });

    currentIndex = highlight.endOffset;
  });

  // Add remaining text
  if (currentIndex < text.length) {
    segments.push({
      text: text.slice(currentIndex),
    });
  }

  const handleHighlightClick = (
    highlight: CommentHighlight,
    event: React.MouseEvent<HTMLSpanElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setThreadPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
    });
    setActiveHighlightId(highlight.id);
  };

  const handleCloseThread = () => {
    setActiveHighlightId(null);
    setThreadPosition(null);
  };

  // Get comments for active highlight
  const activeHighlight = highlights.find((h) => h.id === activeHighlightId);
  const activeComments = activeHighlight
    ? comments.filter((c) => activeHighlight.commentIds.includes(c.id))
    : [];

  return (
    <>
      {segments.map((segment, index) => {
        if (!segment.highlight) {
          return <span key={index}>{segment.text}</span>;
        }

        const isResolved = comments
          .filter((c) => segment.highlight!.commentIds.includes(c.id))
          .every((c) => c.resolved);

        return (
          <span
            key={index}
            onClick={(e) => handleHighlightClick(segment.highlight!, e)}
            className={`cursor-pointer transition-colors ${
              isResolved
                ? 'bg-green-100 hover:bg-green-200'
                : 'bg-yellow-100 hover:bg-yellow-200'
            } ${activeHighlightId === segment.highlight!.id ? 'ring-2 ring-notion-blue' : ''}`}
            style={{
              textDecoration: isResolved ? 'none' : 'underline',
              textDecorationColor: isResolved ? '#10b981' : '#f59e0b',
              textDecorationStyle: 'wavy',
              textUnderlineOffset: '2px',
            }}
          >
            {segment.text}
          </span>
        );
      })}

      {/* Comment Thread Popover */}
      {activeHighlightId && threadPosition && (
        <div
          style={{
            position: 'absolute',
            top: `${threadPosition.top}px`,
            left: `${threadPosition.left}px`,
            zIndex: 1000,
          }}
          className="w-96 bg-white rounded-lg shadow-2xl border border-notion-border max-h-[500px] overflow-hidden"
        >
          <CommentThread
            comments={activeComments}
            pageId={pageId}
            blockId={blockId}
            onCommentAdded={onCommentAdded}
            onCommentUpdated={onCommentUpdated}
            onCommentDeleted={onCommentDeleted}
            onClose={handleCloseThread}
          />
        </div>
      )}
    </>
  );
};
