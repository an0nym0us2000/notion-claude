import React from 'react';
import type { Block } from '@/lib/types';
import { TextBlock } from './TextBlock';

interface BlockRendererProps {
  block: Block;
  onUpdate?: (block: Block) => void;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block, onUpdate }) => {
  // For Phase 1, we only support text blocks
  // Other block types will be added in Phase 2
  switch (block.type) {
    case 'text':
    case 'heading1':
    case 'heading2':
    case 'heading3':
    case 'bullet':
    case 'number':
    case 'todo':
    case 'quote':
    case 'code':
      return <TextBlock block={block} onUpdate={onUpdate} />;
    case 'divider':
      return <hr className="my-4 border-notion-border" />;
    default:
      return <TextBlock block={block} onUpdate={onUpdate} />;
  }
};
