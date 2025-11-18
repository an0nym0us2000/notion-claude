import React, { useState, useMemo } from 'react';
import { Database, DatabaseView, DatabaseProperty } from '@/lib/types';
import { PropertyEditor } from './PropertyEditor';

interface BoardViewProps {
  database: Database;
  view: DatabaseView;
  onAddRow: (values?: Record<string, any>) => void;
  onUpdateRow: (rowId: string, values: Record<string, any>) => void;
  onDeleteRow: (rowId: string) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  database,
  view,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
}) => {
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    propertyId: string;
  } | null>(null);

  // Find the select property to group by (first select property or fallback)
  const groupByProperty = useMemo(() => {
    const groupByPropId = view.config.groupBy;
    if (groupByPropId) {
      return database.properties.find((p) => p.id === groupByPropId);
    }
    // Default to first select property
    return database.properties.find((p) => p.type === 'select');
  }, [database.properties, view.config.groupBy]);

  // Group rows by the select property value
  const groupedRows = useMemo(() => {
    if (!groupByProperty) {
      return { 'Ungrouped': database.rows };
    }

    const groups: Record<string, typeof database.rows> = {};

    // Initialize groups with all options
    groupByProperty.config?.options?.forEach((option) => {
      groups[option.id] = [];
    });

    // Add ungrouped category
    groups['_ungrouped'] = [];

    // Assign rows to groups
    database.rows.forEach((row) => {
      const value = row.values[groupByProperty.id];
      if (value && groups[value]) {
        groups[value].push(row);
      } else {
        groups['_ungrouped'].push(row);
      }
    });

    return groups;
  }, [database.rows, groupByProperty]);

  const handleCellChange = (rowId: string, propertyId: string, value: any) => {
    onUpdateRow(rowId, { [propertyId]: value });
    setEditingCell(null);
  };

  const visibleProperties = database.properties.filter(
    (prop) => !view.config.hiddenProperties?.includes(prop.id) && prop.id !== groupByProperty?.id
  );

  // Get title property (first text property or first property)
  const titleProperty = database.properties.find((p) => p.type === 'text') || database.properties[0];

  if (!groupByProperty) {
    return (
      <div className="text-center py-8 text-notion-text-secondary">
        <p>Board view requires a Select property.</p>
        <p className="text-sm mt-2">Add a Select property to use this view.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {/* Render columns for each group */}
      {Object.entries(groupedRows).map(([groupId, rows]) => {
        const option = groupByProperty.config?.options?.find((o) => o.id === groupId);
        const columnName = option?.name || 'Ungrouped';
        const columnColor = option?.color || '#888888';

        return (
          <div
            key={groupId}
            className="flex-shrink-0 w-80 bg-notion-bg-secondary rounded-lg p-3"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: columnColor }}
                />
                <h3 className="font-medium text-sm">{columnName}</h3>
                <span className="text-xs text-notion-text-tertiary">
                  {rows.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {rows.map((row) => {
                const titleValue = titleProperty ? row.values[titleProperty.id] : 'Untitled';
                const isSelected = selectedRow === row.id;

                return (
                  <div
                    key={row.id}
                    className={`bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition-shadow ${
                      isSelected ? 'border-blue-500 shadow-md' : 'border-notion-border'
                    }`}
                    onClick={() => setSelectedRow(row.id)}
                  >
                    {/* Card Title */}
                    <div className="font-medium mb-2 text-sm">
                      {titleValue || 'Untitled'}
                    </div>

                    {/* Card Properties */}
                    {isSelected && (
                      <div className="space-y-2 mt-3 pt-3 border-t border-notion-border">
                        {visibleProperties.slice(0, 3).map((property) => {
                          const value = row.values[property.id];
                          const isEditing =
                            editingCell?.rowId === row.id &&
                            editingCell?.propertyId === property.id;

                          return (
                            <div key={property.id} className="text-xs">
                              <div className="text-notion-text-tertiary mb-1">
                                {property.name}
                              </div>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCell({ rowId: row.id, propertyId: property.id });
                                }}
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
                                  <div className="px-2 py-1 rounded hover:bg-notion-hover">
                                    {renderPropertyValue(property, value)}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this card?')) {
                              onDeleteRow(row.id);
                              setSelectedRow(null);
                            }
                          }}
                          className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded mt-2"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Card Button */}
              <button
                onClick={() => {
                  const newValues = groupId !== '_ungrouped' ? { [groupByProperty.id]: groupId } : {};
                  onAddRow(newValues);
                }}
                className="w-full px-3 py-2 text-left text-sm text-notion-text-secondary hover:bg-white hover:shadow-sm rounded-lg border border-dashed border-notion-border"
              >
                + Add Card
              </button>
            </div>
          </div>
        );
      })}
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
      return value ? '☑️' : '☐';

    case 'date':
      return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

    case 'select':
      const option = property.config?.options?.find((o) => o.id === value);
      return option ? (
        <span
          className="inline-block px-2 py-0.5 rounded text-xs"
          style={{ backgroundColor: option.color + '20', color: option.color }}
        >
          {option.name}
        </span>
      ) : (
        value
      );

    case 'multi-select':
      return (
        <div className="flex gap-1 flex-wrap">
          {Array.isArray(value) &&
            value.slice(0, 2).map((id) => {
              const option = property.config?.options?.find((o) => o.id === id);
              return option ? (
                <span
                  key={id}
                  className="inline-block px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: option.color + '20',
                    color: option.color,
                  }}
                >
                  {option.name}
                </span>
              ) : null;
            })}
          {Array.isArray(value) && value.length > 2 && (
            <span className="text-xs text-notion-text-tertiary">
              +{value.length - 2}
            </span>
          )}
        </div>
      );

    case 'number':
      return value.toLocaleString();

    default:
      return <span className="text-xs">{value}</span>;
  }
}
