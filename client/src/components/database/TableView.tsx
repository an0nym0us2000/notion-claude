import React, { useState } from 'react';
import { Database, DatabaseView, DatabaseProperty, DatabaseRow } from '@/lib/types';
import { PropertyEditor } from './PropertyEditor';
import { RelationCell } from './RelationCell';

interface TableViewProps {
  database: Database;
  view: DatabaseView;
  onAddProperty: (name: string, type: string) => void;
  onUpdateProperty: (propertyId: string, updates: any) => void;
  onDeleteProperty: (propertyId: string) => void;
  onAddRow: (values?: Record<string, any>) => void;
  onUpdateRow: (rowId: string, values: Record<string, any>) => void;
  onDeleteRow: (rowId: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  database,
  view,
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
}) => {
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    propertyId: string;
  } | null>(null);
  const [showPropertyMenu, setShowPropertyMenu] = useState(false);

  const visibleProperties = database.properties.filter(
    (prop) => !view.config.hiddenProperties?.includes(prop.id)
  );

  const handleCellChange = (rowId: string, propertyId: string, value: any) => {
    onUpdateRow(rowId, { [propertyId]: value });
    setEditingCell(null);
  };

  const handleAddNewProperty = () => {
    const name = prompt('Property name:');
    if (!name) return;

    const type = prompt('Property type (text, number, select, date, checkbox):') || 'text';
    onAddProperty(name, type);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        {/* Table Header */}
        <thead>
          <tr className="bg-notion-bg border-b border-notion-border">
            {/* Row actions column */}
            <th className="w-8 px-2 py-2"></th>

            {/* Property columns */}
            {visibleProperties.map((property) => (
              <th
                key={property.id}
                className="px-3 py-2 text-left text-sm font-medium text-notion-text-secondary group"
              >
                <div className="flex items-center justify-between">
                  <span>{property.name}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button
                      onClick={() => {
                        const newName = prompt('New name:', property.name);
                        if (newName) {
                          onUpdateProperty(property.id, { name: newName });
                        }
                      }}
                      className="px-2 py-1 text-xs hover:bg-notion-hover rounded"
                      title="Rename"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete property "${property.name}"?`)) {
                          onDeleteProperty(property.id);
                        }
                      }}
                      className="px-2 py-1 text-xs hover:bg-red-50 text-red-600 rounded"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </th>
            ))}

            {/* Add property button */}
            <th className="px-3 py-2">
              <button
                onClick={handleAddNewProperty}
                className="text-sm text-notion-text-secondary hover:bg-notion-hover px-2 py-1 rounded"
              >
                + Add Property
              </button>
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {database.rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-notion-border hover:bg-notion-hover group"
            >
              {/* Row actions */}
              <td className="px-2 py-2">
                <button
                  onClick={() => {
                    if (confirm('Delete this row?')) {
                      onDeleteRow(row.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 text-xs text-notion-text-secondary hover:text-red-600"
                  title="Delete row"
                >
                  🗑️
                </button>
              </td>

              {/* Property cells */}
              {visibleProperties.map((property) => {
                const value = row.values[property.id];
                const isEditing =
                  editingCell?.rowId === row.id &&
                  editingCell?.propertyId === property.id;

                // Special handling for relation type
                if (property.type === 'relation' && property.config?.relationDatabaseId) {
                  return (
                    <td key={property.id} className="px-3 py-2 text-sm">
                      <RelationCell
                        relationDatabaseId={property.config.relationDatabaseId}
                        value={value}
                        onChange={(newValue) => handleCellChange(row.id, property.id, newValue)}
                        multipleSelect={true}
                      />
                    </td>
                  );
                }

                return (
                  <td
                    key={property.id}
                    className="px-3 py-2 text-sm"
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
                      <div className="min-h-[24px] cursor-pointer">
                        {renderCellValue(property, value)}
                      </div>
                    )}
                  </td>
                );
              })}

              <td></td>
            </tr>
          ))}

          {/* Add row button */}
          <tr>
            <td colSpan={visibleProperties.length + 2} className="px-3 py-2">
              <button
                onClick={() => onAddRow({})}
                className="text-sm text-notion-text-secondary hover:bg-notion-hover px-2 py-1 rounded w-full text-left"
              >
                + Add Row
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Helper function to render cell values based on property type
function renderCellValue(property: DatabaseProperty, value: any): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-notion-text-tertiary">Empty</span>;
  }

  switch (property.type) {
    case 'checkbox':
      return value ? '☑️ Yes' : '☐ No';

    case 'date':
      return new Date(value).toLocaleDateString();

    case 'select':
      const option = property.config?.options?.find((o) => o.id === value);
      return option ? (
        <span
          className="px-2 py-0.5 rounded text-xs"
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
            value.map((id) => {
              const option = property.config?.options?.find((o) => o.id === id);
              return option ? (
                <span
                  key={id}
                  className="px-2 py-0.5 rounded text-xs"
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
      return value;
  }
}
