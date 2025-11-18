import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { DatabaseRow } from '@/lib/types';

interface RelationPickerProps {
  relationDatabaseId: string;
  selectedIds: string[];
  onSelect: (selectedIds: string[]) => void;
  onClose: () => void;
  multipleSelect?: boolean;
}

export const RelationPicker: React.FC<RelationPickerProps> = ({
  relationDatabaseId,
  selectedIds,
  onSelect,
  onClose,
  multipleSelect = true,
}) => {
  const [rows, setRows] = useState<DatabaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedIds);

  useEffect(() => {
    loadRelatedRows();
  }, [relationDatabaseId]);

  const loadRelatedRows = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/databases/${relationDatabaseId}`);
      const database = response.data.data.database;
      setRows(database.rows || []);
    } catch (error) {
      console.error('Error loading related database rows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRow = (rowId: string) => {
    if (multipleSelect) {
      if (tempSelectedIds.includes(rowId)) {
        setTempSelectedIds(tempSelectedIds.filter((id) => id !== rowId));
      } else {
        setTempSelectedIds([...tempSelectedIds, rowId]);
      }
    } else {
      setTempSelectedIds([rowId]);
      // Auto-close for single select
      onSelect([rowId]);
      onClose();
    }
  };

  const handleConfirm = () => {
    onSelect(tempSelectedIds);
    onClose();
  };

  const handleClear = () => {
    setTempSelectedIds([]);
  };

  // Get row display name (first text property or row ID)
  const getRowDisplayName = (row: DatabaseRow): string => {
    // Try to find the first text-like value
    const values = Object.values(row.values);
    const firstTextValue = values.find(
      (v) => typeof v === 'string' && v.trim().length > 0
    );
    return firstTextValue || `Row ${row.id.substring(0, 8)}`;
  };

  // Filter rows based on search query
  const filteredRows = rows.filter((row) => {
    if (!searchQuery) return true;
    const displayName = getRowDisplayName(row);
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-notion-border flex items-center justify-between">
          <h3 className="font-semibold">Select Relation</h3>
          <button
            onClick={onClose}
            className="text-notion-text-secondary hover:text-notion-text-primary"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-notion-border">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full px-3 py-2 text-sm border border-notion-border rounded focus:outline-none focus:ring-2 focus:ring-notion-blue"
            autoFocus
          />
        </div>

        {/* Rows List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-4 text-center text-notion-text-secondary">
              Loading...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-4 text-center text-notion-text-secondary">
              {searchQuery ? 'No rows found' : 'No rows available'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredRows.map((row) => {
                const isSelected = tempSelectedIds.includes(row.id);
                const displayName = getRowDisplayName(row);

                return (
                  <button
                    key={row.id}
                    onClick={() => handleToggleRow(row.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-notion-blue'
                        : 'hover:bg-notion-hover'
                    }`}
                  >
                    {multipleSelect && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-notion-border text-notion-blue focus:ring-notion-blue"
                      />
                    )}
                    <div className="flex-1 truncate">
                      <div className="font-medium truncate">{displayName}</div>
                      <div className="text-xs text-notion-text-tertiary">
                        Row ID: {row.id.substring(0, 8)}...
                      </div>
                    </div>
                    {isSelected && !multipleSelect && (
                      <span className="text-notion-blue">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer (for multiple select) */}
        {multipleSelect && (
          <div className="p-3 border-t border-notion-border flex items-center justify-between">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-sm text-notion-text-secondary hover:text-notion-text-primary"
              disabled={tempSelectedIds.length === 0}
            >
              Clear
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-sm border border-notion-border rounded hover:bg-notion-hover"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-1.5 text-sm bg-notion-blue text-white rounded hover:bg-blue-600"
              >
                Select {tempSelectedIds.length > 0 && `(${tempSelectedIds.length})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
