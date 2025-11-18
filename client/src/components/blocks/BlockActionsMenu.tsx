import React, { useState, useRef, useEffect } from 'react';
import type { BlockType } from '@/lib/types';

interface BlockActionsMenuProps {
  onDelete: () => void;
  onDuplicate: () => void;
  onTurnInto: (type: BlockType) => void;
}

const TURN_INTO_OPTIONS: Array<{ type: BlockType; label: string; icon: string }> = [
  { type: 'text', label: 'Text', icon: '📝' },
  { type: 'heading1', label: 'Heading 1', icon: 'H1' },
  { type: 'heading2', label: 'Heading 2', icon: 'H2' },
  { type: 'heading3', label: 'Heading 3', icon: 'H3' },
  { type: 'bullet', label: 'Bulleted list', icon: '•' },
  { type: 'number', label: 'Numbered list', icon: '1.' },
  { type: 'todo', label: 'To-do list', icon: '☑' },
  { type: 'quote', label: 'Quote', icon: '"' },
  { type: 'code', label: 'Code', icon: '</>' },
];

export const BlockActionsMenu: React.FC<BlockActionsMenuProps> = ({
  onDelete,
  onDuplicate,
  onTurnInto,
}) => {
  const [showTurnInto, setShowTurnInto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowTurnInto(false);
      }
    };

    if (showTurnInto) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTurnInto]);

  return (
    <div ref={menuRef} className="relative">
      <button
        className="absolute -left-7 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-notion-hover rounded"
        onClick={(e) => {
          e.stopPropagation();
          setShowTurnInto(!showTurnInto);
        }}
        title="Block actions"
      >
        <svg
          className="w-4 h-4 text-notion-text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>

      {showTurnInto && (
        <div className="absolute left-0 top-6 z-50 w-48 bg-white rounded-lg shadow-lg border border-notion-border py-1">
          <button
            onClick={() => {
              onDelete();
              setShowTurnInto(false);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-notion-hover transition-colors text-red-600"
          >
            Delete
          </button>

          <button
            onClick={() => {
              onDuplicate();
              setShowTurnInto(false);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-notion-hover transition-colors"
          >
            Duplicate
          </button>

          <div className="border-t border-notion-border my-1" />

          <div className="px-3 py-1 text-xs text-notion-text-secondary font-medium">
            TURN INTO
          </div>

          {TURN_INTO_OPTIONS.map((option) => (
            <button
              key={option.type}
              onClick={() => {
                onTurnInto(option.type);
                setShowTurnInto(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-notion-hover transition-colors flex items-center gap-2"
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
