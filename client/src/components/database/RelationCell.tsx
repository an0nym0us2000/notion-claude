import React, { useState, useEffect } from 'react';
import { RelationPicker } from './RelationPicker';
import { api } from '@/lib/api';
import type { DatabaseRow } from '@/lib/types';

interface RelationCellProps {
  relationDatabaseId: string;
  value: string | string[] | null;
  onChange: (value: string[]) => void;
  multipleSelect?: boolean;
}

export const RelationCell: React.FC<RelationCellProps> = ({
  relationDatabaseId,
  value,
  onChange,
  multipleSelect = true,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [relatedRows, setRelatedRows] = useState<Record<string, DatabaseRow>>({});
  const [loading, setLoading] = useState(false);

  // Normalize value to array
  const selectedIds = Array.isArray(value) ? value : value ? [value] : [];

  useEffect(() => {
    if (selectedIds.length > 0) {
      loadRelatedRows();
    }
  }, [selectedIds.join(',')]);

  const loadRelatedRows = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/databases/${relationDatabaseId}`);
      const database = response.data.data.database;
      const rowsMap: Record<string, DatabaseRow> = {};

      database.rows.forEach((row: DatabaseRow) => {
        if (selectedIds.includes(row.id)) {
          rowsMap[row.id] = row;
        }
      });

      setRelatedRows(rowsMap);
    } catch (error) {
      console.error('Error loading related rows:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRowDisplayName = (row: DatabaseRow): string => {
    const values = Object.values(row.values);
    const firstTextValue = values.find(
      (v) => typeof v === 'string' && v.trim().length > 0
    );
    return firstTextValue || `Row ${row.id.substring(0, 8)}`;
  };

  const handleSelect = (newSelectedIds: string[]) => {
    onChange(newSelectedIds);
  };

  const handleRemove = (rowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelectedIds = selectedIds.filter((id) => id !== rowId);
    onChange(newSelectedIds);
  };

  return (
    <div className="relative">
      <div
        onClick={() => setShowPicker(true)}
        className="min-h-[32px] px-2 py-1 rounded hover:bg-notion-hover cursor-pointer"
      >
        {loading ? (
          <div className="text-xs text-notion-text-secondary">Loading...</div>
        ) : selectedIds.length === 0 ? (
          <div className="text-xs text-notion-text-tertiary">Empty</div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selectedIds.map((rowId) => {
              const row = relatedRows[rowId];
              const displayName = row ? getRowDisplayName(row) : `Row ${rowId.substring(0, 8)}`;

              return (
                <div
                  key={rowId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  <span className="truncate max-w-[150px]">{displayName}</span>
                  <button
                    onClick={(e) => handleRemove(rowId, e)}
                    className="hover:text-red-600 ml-1"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showPicker && (
        <RelationPicker
          relationDatabaseId={relationDatabaseId}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onClose={() => setShowPicker(false)}
          multipleSelect={multipleSelect}
        />
      )}
    </div>
  );
};
