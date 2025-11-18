import React from 'react';
import type { Block } from '@/lib/types';
import { BlockRenderer } from './BlockRenderer';
import { usePageStore } from '@/stores/pageStore';

interface BlockListProps {
  blocks: Block[];
}

export const BlockList: React.FC<BlockListProps> = ({ blocks }) => {
  const { updateBlock } = usePageStore();

  const handleBlockUpdate = (updatedBlock: Block) => {
    updateBlock(updatedBlock.id, updatedBlock);
  };

  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  // Only render top-level blocks (nested blocks will be handled in Phase 2)
  const topLevelBlocks = sortedBlocks.filter((block) => !block.parentId);

  return (
    <div className="space-y-0.5">
      {topLevelBlocks.map((block) => (
        <BlockRenderer key={block.id} block={block} onUpdate={handleBlockUpdate} />
      ))}
    </div>
  );
};
