import React, { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Block, BlockType } from '@/lib/types';
import { BlockRenderer } from './BlockRenderer';
import { SlashCommandMenu } from './SlashCommandMenu';
import { BlockActionsMenu } from './BlockActionsMenu';
import { DraggableBlock } from './DraggableBlock';
import { NestedBlockList } from './NestedBlockList';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { usePageStore } from '@/stores/pageStore';
import { blockAPI } from '@/lib/api';

interface BlockListProps {
  blocks: Block[];
  pageId: string;
}

export const BlockList: React.FC<BlockListProps> = ({ blocks, pageId }) => {
  const { updateBlock, addBlock, removeBlock, selectAllBlocks, clearSelection } = usePageStore();
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+A or Ctrl+A to select all blocks
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !e.shiftKey) {
        // Check if we're not in an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          selectAllBlocks();
        }
      }
      // Escape to clear selection
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectAllBlocks, clearSelection]);

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

  // Indent block (make it a child of previous sibling)
  const handleIndent = async (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    // Find previous sibling at same level
    const siblings = blocks
      .filter((b) => b.parentId === block.parentId)
      .sort((a, b) => a.order - b.order);

    const blockIndex = siblings.findIndex((b) => b.id === blockId);
    if (blockIndex <= 0) return; // Can't indent first block or if not found

    const previousSibling = siblings[blockIndex - 1];

    try {
      // Update to make this block a child of previous sibling
      const updatedBlock = await blockAPI.update(blockId, {
        parentId: previousSibling.id,
      });
      updateBlock(blockId, updatedBlock);
    } catch (error) {
      console.error('Failed to indent block:', error);
    }
  };

  // Outdent block (make it a sibling of its parent)
  const handleOutdent = async (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block || !block.parentId) return; // Already at top level

    const parent = blocks.find((b) => b.id === block.parentId);
    if (!parent) return;

    try {
      // Update to make this block a sibling of its parent
      const updatedBlock = await blockAPI.update(blockId, {
        parentId: parent.parentId,
      });
      updateBlock(blockId, updatedBlock);
    } catch (error) {
      console.error('Failed to outdent block:', error);
    }
  };

  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  // Only render top-level blocks (nested blocks will be handled recursively)
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
        <NestedBlockList
          blocks={sortedBlocks}
          parentId={null}
          level={0}
          showSlashMenu={showSlashMenu}
          slashMenuBlockId={slashMenuBlockId}
          onMove={moveBlock}
          onUpdate={handleBlockUpdate}
          onEnter={handleEnter}
          onBackspace={handleBackspace}
          onDelete={handleDeleteBlock}
          onDuplicate={handleDuplicateBlock}
          onTurnInto={handleConvertBlock}
          onSlashSelect={handleSlashMenuSelect}
          onSlashClose={handleSlashMenuClose}
          onIndent={handleIndent}
          onOutdent={handleOutdent}
        />
      </div>
      <BulkActionsToolbar pageId={pageId} />
    </DndProvider>
  );
};
