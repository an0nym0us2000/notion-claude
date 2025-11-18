import React, { useState } from 'react';
import type { Database, DatabaseView, Sort, DatabaseProperty } from '@/lib/types';

interface SortMenuProps {
  database: Database;
  view: DatabaseView;
  onUpdateView: (viewId: string, updates: Partial<DatabaseView>) => void;
  onClose: () => void;
}

export const SortMenu: React.FC<SortMenuProps> = ({
  database,
  view,
  onUpdateView,
  onClose,
}) => {
  const [sorts, setSorts] = useState<Sort[]>(view.config.sorts || []);
  const [isAddingSort, setIsAddingSort] = useState(false);
  const [newSortProperty, setNewSortProperty] = useState<string>('');
  const [newSortDirection, setNewSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleAddSort = () => {
    if (!newSortProperty) return;

    const newSort: Sort = {
      id: `sort_${Date.now()}`,
      propertyId: newSortProperty,
      direction: newSortDirection,
    };

    const updatedSorts = [...sorts, newSort];
    setSorts(updatedSorts);
    saveSorts(updatedSorts);

    // Reset form
    setNewSortProperty('');
    setNewSortDirection('asc');
    setIsAddingSort(false);
  };

  const handleRemoveSort = (sortId: string) => {
    const updatedSorts = sorts.filter((s) => s.id !== sortId);
    setSorts(updatedSorts);
    saveSorts(updatedSorts);
  };

  const handleToggleDirection = (sortId: string) => {
    const updatedSorts = sorts.map((s) =>
      s.id === sortId ? { ...s, direction: s.direction === 'asc' ? 'desc' as const : 'asc' as const } : s
    );
    setSorts(updatedSorts);
    saveSorts(updatedSorts);
  };

  const handleMoveSort = (sortId: string, direction: 'up' | 'down') => {
    const currentIndex = sorts.findIndex((s) => s.id === sortId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sorts.length) return;

    const updatedSorts = [...sorts];
    const [movedSort] = updatedSorts.splice(currentIndex, 1);
    updatedSorts.splice(newIndex, 0, movedSort);

    setSorts(updatedSorts);
    saveSorts(updatedSorts);
  };

  const saveSorts = (updatedSorts: Sort[]) => {
    onUpdateView(view.id, {
      config: {
        ...view.config,
        sorts: updatedSorts,
      },
    });
  };

  const getPropertyById = (propertyId: string): DatabaseProperty | undefined => {
    return database.properties.find((p) => p.id === propertyId);
  };

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border border-notion-border rounded-lg shadow-lg z-50 w-96">
      <div className="p-3 border-b border-notion-border flex items-center justify-between">
        <h3 className="font-semibold">Sort</h3>
        <button
          onClick={onClose}
          className="text-notion-text-secondary hover:text-notion-text-primary"
        >
          ✕
        </button>
      </div>

      <div className="p-3 max-h-96 overflow-y-auto">
        {/* Existing Sorts */}
        {sorts.length > 0 && (
          <div className="space-y-2 mb-3">
            {sorts.map((sort, index) => {
              const property = getPropertyById(sort.propertyId);
              return (
                <div
                  key={sort.id}
                  className="flex items-center gap-2 p-2 bg-notion-bg rounded hover:bg-notion-hover"
                >
                  {/* Move Up/Down */}
                  <div className="flex flex-col">
                    <button
                      onClick={() => handleMoveSort(sort.id, 'up')}
                      disabled={index === 0}
                      className="text-xs text-notion-text-secondary hover:text-notion-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMoveSort(sort.id, 'down')}
                      disabled={index === sorts.length - 1}
                      className="text-xs text-notion-text-secondary hover:text-notion-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex-1 text-sm">
                    <span className="font-medium">{property?.name || 'Unknown'}</span>
                  </div>

                  {/* Direction Toggle */}
                  <button
                    onClick={() => handleToggleDirection(sort.id)}
                    className="px-2 py-1 text-xs border border-notion-border rounded hover:bg-white"
                    title="Toggle sort direction"
                  >
                    {sort.direction === 'asc' ? '↑ Ascending' : '↓ Descending'}
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemoveSort(sort.id)}
                    className="text-notion-text-secondary hover:text-red-600"
                    title="Remove sort"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Sort Form */}
        {isAddingSort ? (
          <div className="space-y-2 p-2 bg-notion-bg rounded">
            {/* Property Selection */}
            <select
              value={newSortProperty}
              onChange={(e) => setNewSortProperty(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-notion-border rounded"
            >
              <option value="">Select property...</option>
              {database.properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </select>

            {/* Direction Selection */}
            {newSortProperty && (
              <div className="flex gap-2">
                <button
                  onClick={() => setNewSortDirection('asc')}
                  className={`flex-1 px-2 py-1.5 text-sm border rounded ${
                    newSortDirection === 'asc'
                      ? 'border-notion-blue bg-blue-50 text-notion-blue'
                      : 'border-notion-border hover:bg-notion-hover'
                  }`}
                >
                  ↑ Ascending
                </button>
                <button
                  onClick={() => setNewSortDirection('desc')}
                  className={`flex-1 px-2 py-1.5 text-sm border rounded ${
                    newSortDirection === 'desc'
                      ? 'border-notion-blue bg-blue-50 text-notion-blue'
                      : 'border-notion-border hover:bg-notion-hover'
                  }`}
                >
                  ↓ Descending
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleAddSort}
                disabled={!newSortProperty}
                className="flex-1 px-3 py-1.5 text-sm bg-notion-blue text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAddingSort(false);
                  setNewSortProperty('');
                  setNewSortDirection('asc');
                }}
                className="flex-1 px-3 py-1.5 text-sm border border-notion-border rounded hover:bg-notion-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingSort(true)}
            className="w-full px-3 py-1.5 text-sm text-left text-notion-text-secondary hover:bg-notion-hover rounded"
          >
            + Add sort
          </button>
        )}

        {sorts.length === 0 && !isAddingSort && (
          <div className="text-center py-6 text-sm text-notion-text-secondary">
            No sorts applied
          </div>
        )}
      </div>
    </div>
  );
};
