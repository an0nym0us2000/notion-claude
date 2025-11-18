import React from 'react';
import type { Block } from '@/lib/types';
import { TextBlock } from './TextBlock';
import { HeadingBlock } from './HeadingBlock';
import { BulletListBlock } from './BulletListBlock';
import { NumberedListBlock } from './NumberedListBlock';
import { TodoBlock } from './TodoBlock';
import { QuoteBlock } from './QuoteBlock';
import { CodeBlock } from './CodeBlock';
import { DatabaseBlock } from '../database/DatabaseBlock';

interface BlockRendererProps {
  block: Block;
  onUpdate?: (block: Block) => void;
  onEnter?: () => void;
  onBackspace?: () => void;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  onUpdate,
  onEnter,
  onBackspace
}) => {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} onUpdate={onUpdate} onEnter={onEnter} onBackspace={onBackspace} />;

    case 'heading1':
      return <HeadingBlock block={block} level={1} onUpdate={onUpdate} onEnter={onEnter} onBackspace={onBackspace} />;

    case 'heading2':
      return <HeadingBlock block={block} level={2} onUpdate={onUpdate} onEnter={onEnter} onBackspace={onBackspace} />;

    case 'heading3':
      return <HeadingBlock block={block} level={3} onUpdate={onUpdate} onEnter={onEnter} onBackspace={onBackspace} />;

    case 'bullet':
      return <BulletListBlock block={block} onUpdate={onUpdate} onEnter={onEnter} onBackspace={onBackspace} />;

    case 'number':
      return <NumberedListBlock block={block} onUpdate={onUpdate} onEnter={onEnter} onBackspace={onBackspace} />;

    case 'todo':
      return <TodoBlock block={block} onUpdate={onUpdate} onEnter={onEnter} onBackspace={onBackspace} />;

    case 'quote':
      return <QuoteBlock block={block} onUpdate={onUpdate} onEnter={onEnter} onBackspace={onBackspace} />;

    case 'code':
      return <CodeBlock block={block} onUpdate={onUpdate} onEnter={onEnter} onBackspace={onBackspace} />;

    case 'divider':
      return <hr className="my-4 border-notion-border" />;

    case 'database':
      return <DatabaseBlock blockId={block.id} />;

    default:
      return <TextBlock block={block} onUpdate={onUpdate} onEnter={onEnter} onBackspace={onBackspace} />;
  }
};
