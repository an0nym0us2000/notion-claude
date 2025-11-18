import React, { useState } from 'react';
import type { Database, DatabaseView, Filter, DatabaseProperty } from '@/lib/types';

interface FilterMenuProps {
  database: Database;
  view: DatabaseView;
  onUpdateView: (viewId: string, updates: Partial<DatabaseView>) => void;
  onClose: () => void;
}

const FILTER_OPERATORS: Record<string, { label: string; operators: string[] }> = {
  text: {
    label: 'Text',
    operators: ['equals', 'not_equals', 'contains', 'does_not_contain', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
  },
  number: {
    label: 'Number',
    operators: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'is_empty', 'is_not_empty'],
  },
  select: {
    label: 'Select',
    operators: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
  },
  multi_select: {
    label: 'Multi-select',
    operators: ['contains', 'does_not_contain', 'is_empty', 'is_not_empty'],
  },
  checkbox: {
    label: 'Checkbox',
    operators: ['checked', 'unchecked'],
  },
  date: {
    label: 'Date',
    operators: ['equals', 'before', 'after', 'on_or_before', 'on_or_after', 'is_empty', 'is_not_empty'],
  },
};

const OPERATOR_LABELS: Record<string, string> = {
  equals: 'Equals',
  not_equals: 'Does not equal',
  contains: 'Contains',
  does_not_contain: 'Does not contain',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
  is_empty: 'Is empty',
  is_not_empty: 'Is not empty',
  greater_than: 'Greater than',
  less_than: 'Less than',
  greater_than_or_equal: 'Greater than or equal',
  less_than_or_equal: 'Less than or equal',
  checked: 'Is checked',
  unchecked: 'Is not checked',
  before: 'Before',
  after: 'After',
  on_or_before: 'On or before',
  on_or_after: 'On or after',
};

export const FilterMenu: React.FC<FilterMenuProps> = ({
  database,
  view,
  onUpdateView,
  onClose,
}) => {
  const [filters, setFilters] = useState<Filter[]>(view.config.filters || []);
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [newFilterProperty, setNewFilterProperty] = useState<string>('');
  const [newFilterOperator, setNewFilterOperator] = useState<string>('');
  const [newFilterValue, setNewFilterValue] = useState<any>('');

  const handleAddFilter = () => {
    if (!newFilterProperty || !newFilterOperator) return;

    const newFilter: Filter = {
      id: `filter_${Date.now()}`,
      propertyId: newFilterProperty,
      operator: newFilterOperator,
      value: newFilterValue,
    };

    const updatedFilters = [...filters, newFilter];
    setFilters(updatedFilters);
    saveFilters(updatedFilters);

    // Reset form
    setNewFilterProperty('');
    setNewFilterOperator('');
    setNewFilterValue('');
    setIsAddingFilter(false);
  };

  const handleRemoveFilter = (filterId: string) => {
    const updatedFilters = filters.filter((f) => f.id !== filterId);
    setFilters(updatedFilters);
    saveFilters(updatedFilters);
  };

  const saveFilters = (updatedFilters: Filter[]) => {
    onUpdateView(view.id, {
      config: {
        ...view.config,
        filters: updatedFilters,
      },
    });
  };

  const getPropertyById = (propertyId: string): DatabaseProperty | undefined => {
    return database.properties.find((p) => p.id === propertyId);
  };

  const getOperatorsForProperty = (propertyId: string): string[] => {
    const property = getPropertyById(propertyId);
    if (!property) return [];
    return FILTER_OPERATORS[property.type]?.operators || [];
  };

  const needsValue = (operator: string): boolean => {
    return !['is_empty', 'is_not_empty', 'checked', 'unchecked'].includes(operator);
  };

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border border-notion-border rounded-lg shadow-lg z-50 w-96">
      <div className="p-3 border-b border-notion-border flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        <button
          onClick={onClose}
          className="text-notion-text-secondary hover:text-notion-text-primary"
        >
          ✕
        </button>
      </div>

      <div className="p-3 max-h-96 overflow-y-auto">
        {/* Existing Filters */}
        {filters.length > 0 && (
          <div className="space-y-2 mb-3">
            {filters.map((filter) => {
              const property = getPropertyById(filter.propertyId);
              return (
                <div
                  key={filter.id}
                  className="flex items-center gap-2 p-2 bg-notion-bg rounded hover:bg-notion-hover"
                >
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{property?.name || 'Unknown'}</span>
                    <span className="mx-1 text-notion-text-secondary">
                      {OPERATOR_LABELS[filter.operator] || filter.operator}
                    </span>
                    {needsValue(filter.operator) && (
                      <span className="font-medium">{filter.value}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveFilter(filter.id)}
                    className="text-notion-text-secondary hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Filter Form */}
        {isAddingFilter ? (
          <div className="space-y-2 p-2 bg-notion-bg rounded">
            {/* Property Selection */}
            <select
              value={newFilterProperty}
              onChange={(e) => {
                setNewFilterProperty(e.target.value);
                setNewFilterOperator('');
                setNewFilterValue('');
              }}
              className="w-full px-2 py-1.5 text-sm border border-notion-border rounded"
            >
              <option value="">Select property...</option>
              {database.properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </select>

            {/* Operator Selection */}
            {newFilterProperty && (
              <select
                value={newFilterOperator}
                onChange={(e) => setNewFilterOperator(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-notion-border rounded"
              >
                <option value="">Select operator...</option>
                {getOperatorsForProperty(newFilterProperty).map((op) => (
                  <option key={op} value={op}>
                    {OPERATOR_LABELS[op] || op}
                  </option>
                ))}
              </select>
            )}

            {/* Value Input */}
            {newFilterProperty && newFilterOperator && needsValue(newFilterOperator) && (
              <input
                type="text"
                value={newFilterValue}
                onChange={(e) => setNewFilterValue(e.target.value)}
                placeholder="Enter value..."
                className="w-full px-2 py-1.5 text-sm border border-notion-border rounded"
              />
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleAddFilter}
                disabled={!newFilterProperty || !newFilterOperator}
                className="flex-1 px-3 py-1.5 text-sm bg-notion-blue text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAddingFilter(false);
                  setNewFilterProperty('');
                  setNewFilterOperator('');
                  setNewFilterValue('');
                }}
                className="flex-1 px-3 py-1.5 text-sm border border-notion-border rounded hover:bg-notion-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingFilter(true)}
            className="w-full px-3 py-1.5 text-sm text-left text-notion-text-secondary hover:bg-notion-hover rounded"
          >
            + Add filter
          </button>
        )}

        {filters.length === 0 && !isAddingFilter && (
          <div className="text-center py-6 text-sm text-notion-text-secondary">
            No filters applied
          </div>
        )}
      </div>
    </div>
  );
};
