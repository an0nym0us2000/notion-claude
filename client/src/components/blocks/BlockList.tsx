import React, { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Block, BlockType } from '@/lib/types';
import { BlockRenderer } from './BlockRenderer';
import { SlashCommandMenu } from './SlashCommandMenu';
import { BlockActionsMenu } from './BlockActionsMenu';
import { DraggableBlock } from './DraggableBlock';
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

  // Drag and drop handler
  const moveBlock = useCallback(async (dragIndex: number, hoverIndex: number) => {
    const draggedBlock = topLevelBlocks[dragIndex];
    const targetBlock = topLevelBlocks[hoverIndex];

    if (!draggedBlock || !targetBlock) return;

    try {
      // Calculate new order between blocks
      let newOrder: number;

      if (hoverIndex === 0) {
        // Moving to top
        newOrder = topLevelBlocks[0].order / 2;
      } else if (hoverIndex === topLevelBlocks.length - 1) {
        // Moving to bottom
        newOrder = topLevelBlocks[topLevelBlocks.length - 1].order + 1;
      } else {
        // Moving between blocks
        const prevBlock = topLevelBlocks[hoverIndex - 1];
        const nextBlock = topLevelBlocks[hoverIndex];
        newOrder = (prevBlock.order + nextBlock.order) / 2;
      }

      // Optimistic update
      updateBlock(draggedBlock.id, { ...draggedBlock, order: newOrder });

      // Server update
      await blockAPI.reorder({
        blockId: draggedBlock.id,
        pageId,
        afterBlockId: hoverIndex > 0 ? topLevelBlocks[hoverIndex - 1].id : undefined,
      });
    } catch (error) {
      console.error('Failed to reorder block:', error);
      // Revert on error
      updateBlock(draggedBlock.id, draggedBlock);
    }
  }, [topLevelBlocks, pageId, updateBlock]);

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
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-0.5">
        {topLevelBlocks.map((block, index) => (
          <DraggableBlock
            key={block.id}
            block={block}
            index={index}
            onMove={moveBlock}
          >
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
          </DraggableBlock>
        ))}
      </div>
    </DndProvider>
  );
};
