import React, { useState, useEffect, useRef } from 'react';
import type { BlockType } from '@/lib/types';

interface BlockCommand {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  keywords: string[];
}

const BLOCK_COMMANDS: BlockCommand[] = [
  {
    type: 'text',
    label: 'Text',
    description: 'Just start writing with plain text',
    icon: '📝',
    keywords: ['text', 'paragraph', 'p'],
  },
  {
    type: 'heading1',
    label: 'Heading 1',
    description: 'Big section heading',
    icon: 'H1',
    keywords: ['heading', 'h1', 'title', 'large'],
  },
  {
    type: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: 'H2',
    keywords: ['heading', 'h2', 'subtitle', 'medium'],
  },
  {
    type: 'heading3',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: 'H3',
    keywords: ['heading', 'h3', 'small'],
  },
  {
    type: 'bullet',
    label: 'Bulleted list',
    description: 'Create a simple bulleted list',
    icon: '•',
    keywords: ['bullet', 'list', 'ul', 'unordered'],
  },
  {
    type: 'number',
    label: 'Numbered list',
    description: 'Create a list with numbering',
    icon: '1.',
    keywords: ['number', 'numbered', 'list', 'ol', 'ordered'],
  },
  {
    type: 'todo',
    label: 'To-do list',
    description: 'Track tasks with a to-do list',
    icon: '☑',
    keywords: ['todo', 'task', 'checkbox', 'check'],
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'Capture a quote',
    icon: '"',
    keywords: ['quote', 'blockquote', 'citation'],
  },
  {
    type: 'code',
    label: 'Code',
    description: 'Capture a code snippet',
    icon: '</>',
    keywords: ['code', 'codeblock', 'snippet', 'programming'],
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Visually divide blocks',
    icon: '—',
    keywords: ['divider', 'separator', 'line', 'hr'],
  },
  {
    type: 'database',
    label: 'Database',
    description: 'Create a database with table, list, and board views',
    icon: '🗂️',
    keywords: ['database', 'table', 'spreadsheet', 'data', 'collection', 'board', 'kanban'],
  },
];

interface SlashCommandMenuProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  filter?: string;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  onSelect,
  onClose,
  filter = '',
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fuzzy search filter
  const filteredCommands = React.useMemo(() => {
    if (!filter) return BLOCK_COMMANDS;

    const searchTerm = filter.toLowerCase();
    return BLOCK_COMMANDS.filter((cmd) => {
      return (
        cmd.label.toLowerCase().includes(searchTerm) ||
        cmd.description.toLowerCase().includes(searchTerm) ||
        cmd.keywords.some((keyword) => keyword.toLowerCase().includes(searchTerm))
      );
    });
  }, [filter]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].type);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  if (filteredCommands.length === 0) {
    return (
      <div
        ref={menuRef}
        className="absolute z-50 mt-1 w-80 bg-white rounded-lg shadow-lg border border-notion-border p-2"
      >
        <div className="px-3 py-2 text-sm text-notion-text-secondary">
          No results found
        </div>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="absolute z-50 mt-1 w-80 bg-white rounded-lg shadow-lg border border-notion-border p-2 max-h-96 overflow-y-auto"
    >
      <div className="text-xs text-notion-text-secondary px-3 py-2 font-medium">
        BASIC BLOCKS
      </div>
      {filteredCommands.map((cmd, index) => (
        <div
          key={cmd.type}
          onClick={() => onSelect(cmd.type)}
          className={`
            px-3 py-2 rounded cursor-pointer transition-colors
            ${
              index === selectedIndex
                ? 'bg-notion-hover'
                : 'hover:bg-notion-hover'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-notion-bg-secondary rounded text-lg">
              {cmd.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm text-notion-text">
                {cmd.label}
              </div>
              <div className="text-xs text-notion-text-secondary">
                {cmd.description}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
