import React, { useState } from 'react';
import { api } from '@/lib/api';
import type { Block } from '@/lib/types';

interface SaveAsTemplateProps {
  pageId: string;
  pageTitle: string;
  pageIcon?: string;
  workspaceId: string;
  blocks: Block[];
  onClose: () => void;
  onSaved?: () => void;
}

const CATEGORIES = ['Work', 'Personal', 'Education', 'Other'];

export const SaveAsTemplate: React.FC<SaveAsTemplateProps> = ({
  pageId,
  pageTitle,
  pageIcon,
  workspaceId,
  blocks,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState(pageTitle || 'Untitled Template');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(pageIcon || '📄');
  const [category, setCategory] = useState('Work');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      setSaving(true);

      // Transform blocks to template format (remove IDs and metadata)
      const templateBlocks = blocks.map((block) => ({
        type: block.type,
        content: block.content,
        properties: block.properties,
        order: block.order,
        parentId: block.parentId,
      }));

      await api.post('/api/templates', {
        workspaceId,
        name,
        description: description || undefined,
        icon,
        category,
        blocks: templateBlocks,
        isPublic,
      });

      alert('Template saved successfully!');
      onSaved?.();
      onClose();
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(error.response?.data?.message || 'Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-4 border-b border-notion-border flex items-center justify-between">
          <h3 className="text-lg font-semibold">Save as Template</h3>
          <button
            onClick={onClose}
            className="text-notion-text-secondary hover:text-notion-text-primary"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-notion-text-secondary mb-1">
              Icon
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Enter an emoji"
              className="w-full px-3 py-2 border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue"
              maxLength={2}
            />
            <p className="text-xs text-notion-text-tertiary mt-1">
              Use an emoji (e.g., 📝, 📋, 📊)
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-notion-text-secondary mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
              className="w-full px-3 py-2 border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-notion-text-secondary mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this template for?"
              rows={3}
              className="w-full px-3 py-2 border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-notion-text-secondary mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Public Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded border-notion-border text-notion-blue focus:ring-notion-blue"
            />
            <label htmlFor="isPublic" className="text-sm cursor-pointer">
              <span className="font-medium">Make public</span>
              <p className="text-xs text-notion-text-secondary">
                Allow other users in the workspace to use this template
              </p>
            </label>
          </div>

          {/* Block count info */}
          <div className="p-3 bg-notion-bg rounded-lg">
            <div className="text-sm text-notion-text-secondary">
              This template will include <strong>{blocks.length}</strong> block{blocks.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-notion-border flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-notion-border rounded-lg hover:bg-notion-hover disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-notion-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
};
