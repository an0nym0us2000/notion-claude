import React, { useState } from 'react';
import type { Block, BlockType } from '@/lib/types';
import { BlockRenderer } from './BlockRenderer';
import { SlashCommandMenu } from './SlashCommandMenu';
import { BlockActionsMenu } from './BlockActionsMenu';
import { usePageStore } from '@/stores/pageStore';
import { blockAPI } from '@/lib/api';

interface BlockListProps {
  blocks: Block[];
  pageId: string;
}

export const BlockList: React.FC<BlockListProps> = ({ blocks, pageId }) => {
  const { updateBlock, addBlock, removeBlock } = usePageStore();
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);

  const handleBlockUpdate = (updatedBlock: Block) => {
    updateBlock(updatedBlock.id, updatedBlock);
  };

  const handleCreateBlock = async (afterBlockId: string, type: BlockType = 'text') => {
    try {
      const newBlock = await blockAPI.create({
        pageId,
        type,
        content: '',
        afterBlockId,
      });
      addBlock(newBlock);
      return newBlock;
    } catch (error) {
      console.error('Failed to create block:', error);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await blockAPI.delete(blockId);
      removeBlock(blockId);
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  };

  const handleConvertBlock = async (blockId: string, newType: BlockType) => {
    try {
      const updatedBlock = await blockAPI.update(blockId, { type: newType });
      updateBlock(blockId, updatedBlock);
      setShowSlashMenu(false);
      setSlashMenuBlockId(null);
    } catch (error) {
      console.error('Failed to convert block:', error);
    }
  };

  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  // Only render top-level blocks (nested blocks will be handled later)
  const topLevelBlocks = sortedBlocks.filter((block) => !block.parentId);

  const handleEnter = async (blockId: string) => {
    await handleCreateBlock(blockId, 'text');
  };

  const handleBackspace = async (blockId: string) => {
    // Don't delete if it's the only block
    if (topLevelBlocks.length > 1) {
      await handleDeleteBlock(blockId);
    }
  };

  const handleSlash = (blockId: string) => {
    setShowSlashMenu(true);
    setSlashMenuBlockId(blockId);
  };

  const handleSlashMenuSelect = async (type: BlockType) => {
    if (slashMenuBlockId) {
      await handleConvertBlock(slashMenuBlockId, type);
    }
  };

  const handleSlashMenuClose = () => {
    setShowSlashMenu(false);
    setSlashMenuBlockId(null);
  };

  const handleDuplicateBlock = async (blockId: string) => {
    try {
      const duplicatedBlock = await blockAPI.duplicate(blockId);
      addBlock(duplicatedBlock);
    } catch (error) {
      console.error('Failed to duplicate block:', error);
    }
  };

  return (
    <div className="space-y-0.5">
      {topLevelBlocks.map((block) => (
        <div key={block.id} className="relative group">
          <BlockActionsMenu
            onDelete={() => handleDeleteBlock(block.id)}
            onDuplicate={() => handleDuplicateBlock(block.id)}
            onTurnInto={(type) => handleConvertBlock(block.id, type)}
          />
          <BlockRenderer
            block={block}
            onUpdate={handleBlockUpdate}
            onEnter={() => handleEnter(block.id)}
            onBackspace={() => handleBackspace(block.id)}
          />
          {showSlashMenu && slashMenuBlockId === block.id && (
            <SlashCommandMenu
              onSelect={handleSlashMenuSelect}
              onClose={handleSlashMenuClose}
            />
          )}
        </div>
      ))}
    </div>
  );
};
