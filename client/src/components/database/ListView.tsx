import React, { useState } from 'react';
import { Database, DatabaseView, DatabaseProperty, DatabaseRow } from '@/lib/types';
import { PropertyEditor } from './PropertyEditor';

interface ListViewProps {
  database: Database;
  view: DatabaseView;
  onAddRow: (values?: Record<string, any>) => void;
  onUpdateRow: (rowId: string, values: Record<string, any>) => void;
  onDeleteRow: (rowId: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  database,
  view,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    propertyId: string;
  } | null>(null);

  const visibleProperties = database.properties.filter(
    (prop) => !view.config.hiddenProperties?.includes(prop.id)
  );

  const toggleRow = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const handleCellChange = (rowId: string, propertyId: string, value: any) => {
    onUpdateRow(rowId, { [propertyId]: value });
    setEditingCell(null);
  };

  // Get the first text property or first property as title
  const titleProperty = database.properties.find((p) => p.type === 'text') || database.properties[0];

  return (
    <div className="space-y-2">
      {database.rows.map((row) => {
        const isExpanded = expandedRows.has(row.id);
        const titleValue = titleProperty ? row.values[titleProperty.id] : 'Untitled';

        return (
          <div
            key={row.id}
            className="border border-notion-border rounded-lg bg-white hover:shadow-sm transition-shadow"
          >
            {/* Row Header */}
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer"
              onClick={() => toggleRow(row.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <button
                  className="text-notion-text-secondary hover:bg-notion-hover rounded p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRow(row.id);
                  }}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
                <div className="font-medium">{titleValue || 'Untitled'}</div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 opacity-0 hover:opacity-100 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this row?')) {
                      onDeleteRow(row.id);
                    }
                  }}
                  className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Expanded Row Details */}
            {isExpanded && (
              <div className="border-t border-notion-border px-4 py-3 space-y-3">
                {visibleProperties.map((property) => {
                  const value = row.values[property.id];
                  const isEditing =
                    editingCell?.rowId === row.id &&
                    editingCell?.propertyId === property.id;

                  return (
                    <div
                      key={property.id}
                      className="flex items-start gap-4"
                    >
                      {/* Property Name */}
                      <div className="w-32 flex-shrink-0 pt-1.5 text-sm font-medium text-notion-text-secondary">
                        {property.name}
                      </div>

                      {/* Property Value */}
                      <div
                        className="flex-1 min-w-0"
                        onClick={() =>
                          setEditingCell({ rowId: row.id, propertyId: property.id })
                        }
                      >
                        {isEditing ? (
                          <PropertyEditor
                            property={property}
                            value={value}
                            onChange={(newValue) =>
                              handleCellChange(row.id, property.id, newValue)
                            }
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                          />
                        ) : (
                          <div className="min-h-[32px] px-2 py-1.5 rounded hover:bg-notion-hover cursor-pointer">
                            {renderPropertyValue(property, value)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Add New Row Button */}
      <button
        onClick={() => onAddRow({})}
        className="w-full px-4 py-3 text-left text-sm text-notion-text-secondary hover:bg-notion-hover rounded-lg border border-dashed border-notion-border"
      >
        + Add Row
      </button>
    </div>
  );
};

// Helper function to render property values
function renderPropertyValue(property: DatabaseProperty, value: any): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-notion-text-tertiary italic">Empty</span>;
  }

  switch (property.type) {
    case 'checkbox':
      return (
        <span className={value ? 'text-green-600' : 'text-gray-400'}>
          {value ? '☑️ Yes' : '☐ No'}
        </span>
      );

    case 'date':
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    case 'select':
      const option = property.config?.options?.find((o) => o.id === value);
      return option ? (
        <span
          className="inline-block px-2 py-1 rounded text-sm"
          style={{ backgroundColor: option.color + '20', color: option.color }}
        >
          {option.name}
        </span>
      ) : (
        value
      );

    case 'multi-select':
      return (
        <div className="flex gap-2 flex-wrap">
          {Array.isArray(value) &&
            value.map((id) => {
              const option = property.config?.options?.find((o) => o.id === id);
              return option ? (
                <span
                  key={id}
                  className="inline-block px-2 py-1 rounded text-sm"
                  style={{
                    backgroundColor: option.color + '20',
                    color: option.color,
                  }}
                >
                  {option.name}
                </span>
              ) : null;
            })}
        </div>
      );

    case 'url':
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      );

    case 'email':
      return (
        <a
          href={`mailto:${value}`}
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      );

    case 'phone':
      return (
        <a
          href={`tel:${value}`}
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      );

    case 'number':
      return value.toLocaleString();

    default:
      return <span className="text-sm">{value}</span>;
  }
}
