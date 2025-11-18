import React, { useEffect, useState, useRef } from 'react';

interface InlineCommentButtonProps {
  onAddComment: () => void;
}

export const InlineCommentButton: React.FC<InlineCommentButtonProps> = ({
  onAddComment,
}) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();

      if (!selection || selection.isCollapsed || selection.toString().trim() === '') {
        setVisible(false);
        return;
      }

      // Check if selection is within an editable block
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;

      // Walk up the DOM to find if we're in a block
      let element = container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container as HTMLElement;

      // Check if we're in an editable area
      let inEditableArea = false;
      while (element && element !== document.body) {
        if (
          element.isContentEditable ||
          element.tagName === 'TEXTAREA' ||
          element.classList.contains('block-content')
        ) {
          inEditableArea = true;
          break;
        }
        element = element.parentElement!;
      }

      if (!inEditableArea) {
        setVisible(false);
        return;
      }

      // Get selection rectangle
      const rect = range.getBoundingClientRect();

      // Position button above the selection
      setPosition({
        top: rect.top + window.scrollY - 40,
        left: rect.left + window.scrollX + rect.width / 2,
      });
      setVisible(true);
    };

    // Listen to selection changes
    document.addEventListener('selectionchange', handleSelectionChange);

    // Also listen to mouse up in case selection doesn't trigger the event
    document.addEventListener('mouseup', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
    };
  }, []);

  const handleClick = () => {
    onAddComment();
    setVisible(false);
  };

  if (!visible || !position) {
    return null;
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        zIndex: 1000,
      }}
      className="bg-notion-blue text-white px-3 py-1.5 rounded-lg shadow-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center gap-1.5 whitespace-nowrap"
      title="Add comment"
    >
      <span>💬</span>
      <span>Comment</span>
    </button>
  );
};
