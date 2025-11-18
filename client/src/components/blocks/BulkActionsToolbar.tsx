import React from 'react';
import { usePageStore } from '@/stores/pageStore';
import { blockAPI } from '@/lib/api';

interface BulkActionsToolbarProps {
  pageId: string;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({ pageId }) => {
  const { selectedBlocks, blocks, clearSelection, removeBlock } = usePageStore();

  if (selectedBlocks.size === 0) return null;

  const selectedCount = selectedBlocks.size;
  const selectedBlockIds = Array.from(selectedBlocks);

  const handleDelete = async () => {
    if (!confirm(`Delete ${selectedCount} selected block(s)?`)) return;

    try {
      // Delete all selected blocks
      await Promise.all(
        selectedBlockIds.map((blockId) => blockAPI.delete(blockId))
      );

      // Remove from store
      selectedBlockIds.forEach((blockId) => removeBlock(blockId));

      // Clear selection
      clearSelection();
    } catch (error) {
      console.error('Failed to delete blocks:', error);
      alert('Failed to delete some blocks. Please try again.');
    }
  };

  const handleDuplicate = async () => {
    try {
      // Duplicate all selected blocks
      const duplicatedBlocks = await Promise.all(
        selectedBlockIds.map((blockId) => blockAPI.duplicate(blockId))
      );

      // Add to store (the addBlock in store will be called by parent component)
      clearSelection();

      // Refresh page to show duplicated blocks
      window.location.reload();
    } catch (error) {
      console.error('Failed to duplicate blocks:', error);
      alert('Failed to duplicate some blocks. Please try again.');
    }
  };

  const handleClear = () => {
    clearSelection();
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-notion-text text-white rounded-lg shadow-2xl px-4 py-3 flex items-center gap-4">
        <span className="text-sm font-medium">
          {selectedCount} block{selectedCount > 1 ? 's' : ''} selected
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDuplicate}
            className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded transition-colors"
            title="Duplicate selected blocks"
          >
            Duplicate
          </button>

          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 rounded transition-colors"
            title="Delete selected blocks"
          >
            Delete
          </button>

          <div className="w-px h-6 bg-white/20 mx-1" />

          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm hover:bg-white/10 rounded transition-colors"
            title="Clear selection"
          >
            Clear
          </button>
        </div>

        <div className="text-xs text-white/60">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Shift</kbd> +{' '}
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Click</kbd> for range
        </div>
      </div>
    </div>
  );
};
