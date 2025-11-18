import React from 'react';
import { DraggableBlock } from './DraggableBlock';
import { BlockRenderer } from './BlockRenderer';
import { BlockActionsMenu } from './BlockActionsMenu';
import { SlashCommandMenu } from './SlashCommandMenu';
import type { Block, BlockType } from '@/lib/types';

interface NestedBlockListProps {
  blocks: Block[];
  parentId: string | null;
  level: number;
  showSlashMenu: boolean;
  slashMenuBlockId: string | null;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onUpdate: (block: Block) => void;
  onEnter: (blockId: string) => void;
  onBackspace: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onDuplicate: (blockId: string) => void;
  onTurnInto: (blockId: string, type: BlockType) => void;
  onSlashSelect: (type: BlockType) => void;
  onSlashClose: () => void;
  onIndent: (blockId: string) => void;
  onOutdent: (blockId: string) => void;
}

export const NestedBlockList: React.FC<NestedBlockListProps> = ({
  blocks,
  parentId,
  level,
  showSlashMenu,
  slashMenuBlockId,
  onMove,
  onUpdate,
  onEnter,
  onBackspace,
  onDelete,
  onDuplicate,
  onTurnInto,
  onSlashSelect,
  onSlashClose,
  onIndent,
  onOutdent,
}) => {
  // Filter blocks for this level
  const levelBlocks = blocks
    .filter((block) => block.parentId === parentId)
    .sort((a, b) => a.order - b.order);

  if (levelBlocks.length === 0) return null;

  return (
    <div className={level > 0 ? 'ml-6 border-l border-notion-border pl-2' : ''}>
      {levelBlocks.map((block, index) => {
        const hasChildren = blocks.some((b) => b.parentId === block.id);

        return (
          <div key={block.id}>
            <DraggableBlock block={block} index={index} onMove={onMove}>
              <div
                onKeyDown={(e) => {
                  // Tab to indent
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    onIndent(block.id);
                  }
                  // Shift+Tab to outdent
                  if (e.key === 'Tab' && e.shiftKey) {
                    e.preventDefault();
                    onOutdent(block.id);
                  }
                }}
              >
                <BlockActionsMenu
                  onDelete={() => onDelete(block.id)}
                  onDuplicate={() => onDuplicate(block.id)}
                  onTurnInto={(type) => onTurnInto(block.id, type)}
                />
                <BlockRenderer
                  block={block}
                  onUpdate={onUpdate}
                  onEnter={() => onEnter(block.id)}
                  onBackspace={() => onBackspace(block.id)}
                />
                {showSlashMenu && slashMenuBlockId === block.id && (
                  <SlashCommandMenu
                    onSelect={onSlashSelect}
                    onClose={onSlashClose}
                  />
                )}
              </div>
            </DraggableBlock>

            {/* Render nested children */}
            {hasChildren && (
              <NestedBlockList
                blocks={blocks}
                parentId={block.id}
                level={level + 1}
                showSlashMenu={showSlashMenu}
                slashMenuBlockId={slashMenuBlockId}
                onMove={onMove}
                onUpdate={onUpdate}
                onEnter={onEnter}
                onBackspace={onBackspace}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onTurnInto={onTurnInto}
                onSlashSelect={onSlashSelect}
                onSlashClose={onSlashClose}
                onIndent={onIndent}
                onOutdent={onOutdent}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
