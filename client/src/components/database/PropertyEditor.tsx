import React, { useState, useEffect, useRef } from 'react';
import { DatabaseProperty } from '@/lib/types';

interface PropertyEditorProps {
  property: DatabaseProperty;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export const PropertyEditor: React.FC<PropertyEditorProps> = ({
  property,
  value,
  onChange,
  onBlur,
  autoFocus = false,
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (autoFocus) {
      if (inputRef.current) inputRef.current.focus();
      if (textareaRef.current) textareaRef.current.focus();
      if (selectRef.current) selectRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onBlur?.();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onBlur?.();
    }
  };

  switch (property.type) {
    case 'text':
      return (
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 border border-notion-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter text..."
        />
      );

    case 'number':
      return (
        <input
          ref={inputRef}
          type="number"
          value={localValue}
          onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 border border-notion-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter number..."
        />
      );

    case 'url':
      return (
        <input
          ref={inputRef}
          type="url"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 border border-notion-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="https://..."
        />
      );

    case 'email':
      return (
        <input
          ref={inputRef}
          type="email"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 border border-notion-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="email@example.com"
        />
      );

    case 'phone':
      return (
        <input
          ref={inputRef}
          type="tel"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 border border-notion-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Phone number..."
        />
      );

    case 'date':
      return (
        <input
          ref={inputRef}
          type="date"
          value={localValue ? new Date(localValue).toISOString().split('T')[0] : ''}
          onChange={(e) => handleChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
          onBlur={onBlur}
          className="w-full px-2 py-1 border border-notion-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      );

    case 'checkbox':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!localValue}
            onChange={(e) => {
              handleChange(e.target.checked);
              onBlur?.();
            }}
            className="w-4 h-4 border-notion-border rounded"
          />
          <span className="text-sm">{localValue ? 'Yes' : 'No'}</span>
        </label>
      );

    case 'select':
      return (
        <select
          ref={selectRef}
          value={localValue || ''}
          onChange={(e) => {
            handleChange(e.target.value);
            onBlur?.();
          }}
          onBlur={onBlur}
          className="w-full px-2 py-1 border border-notion-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select...</option>
          {property.config?.options?.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      );

    case 'multi-select':
      return (
        <div className="flex flex-wrap gap-2 p-2 border border-notion-border rounded">
          {property.config?.options?.map((option) => {
            const isSelected = Array.isArray(localValue) && localValue.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => {
                  const newValue = isSelected
                    ? (localValue || []).filter((id: string) => id !== option.id)
                    : [...(localValue || []), option.id];
                  handleChange(newValue);
                }}
                className={`px-2 py-1 rounded text-xs ${
                  isSelected
                    ? 'font-medium'
                    : 'opacity-50'
                }`}
                style={{
                  backgroundColor: option.color + '20',
                  color: option.color,
                }}
              >
                {isSelected ? '✓ ' : ''}
                {option.name}
              </button>
            );
          })}
        </div>
      );

    case 'relation':
      return (
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 border border-notion-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Relation (coming soon)..."
          disabled
        />
      );

    default:
      return (
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 border border-notion-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter value..."
        />
      );
  }
};
