import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  blocks?: any[];
  isPublic?: boolean;
  isPredefined?: boolean;
}

interface TemplateGalleryProps {
  workspaceId: string;
  parentId?: string;
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
}

const CATEGORIES = ['All', 'Work', 'Personal', 'Education', 'Other'];

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  workspaceId,
  parentId,
  onSelectTemplate,
  onClose,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [predefinedTemplates, setPredefinedTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTemplates();
  }, [workspaceId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);

      // Load predefined templates
      const predefinedResponse = await api.get('/api/templates/predefined');
      const predefined = predefinedResponse.data.data.templates || [];
      setPredefinedTemplates(predefined.map((t: any) => ({ ...t, isPredefined: true })));

      // Load workspace templates
      const workspaceResponse = await api.get('/api/templates', {
        params: { workspaceId, includePublic: true },
      });
      const workspace = workspaceResponse.data.data.templates || [];
      setTemplates(workspace);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = async (template: Template) => {
    try {
      // Instantiate template to create a new page
      const response = await api.post('/api/templates/instantiate', {
        templateId: template.id,
        workspaceId,
        parentId,
        title: template.name,
      });

      const newPage = response.data.data.page;
      onSelectTemplate(newPage);
      onClose();
    } catch (error) {
      console.error('Error instantiating template:', error);
      alert('Failed to create page from template. Please try again.');
    }
  };

  // Combine and filter templates
  const allTemplates = [...predefinedTemplates, ...templates];
  const filteredTemplates = allTemplates.filter((template) => {
    const matchesCategory =
      selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Group by category
  const templatesByCategory = filteredTemplates.reduce((acc, template) => {
    const category = template.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-notion-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Template Gallery</h2>
            <button
              onClick={onClose}
              className="text-notion-text-secondary hover:text-notion-text-primary text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full px-4 py-2 border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue"
          />
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-3 border-b border-notion-border">
          <div className="flex gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-notion-blue text-white'
                    : 'bg-notion-bg text-notion-text-secondary hover:bg-notion-hover'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-notion-text-secondary">
              Loading templates...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-notion-text-secondary">
              <div className="text-4xl mb-4">📝</div>
              <div className="text-lg">No templates found</div>
              <div className="text-sm mt-2">Try adjusting your search or category filter</div>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-3 text-notion-text-secondary">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="p-4 border border-notion-border rounded-lg hover:border-notion-blue hover:shadow-md transition-all text-left group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">{template.icon || '📄'}</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-notion-text group-hover:text-notion-blue mb-1 truncate">
                              {template.name}
                            </h4>
                            {template.description && (
                              <p className="text-sm text-notion-text-secondary line-clamp-2">
                                {template.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {template.isPredefined && (
                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                  Built-in
                                </span>
                              )}
                              {template.isPublic && (
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                  Public
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-notion-border bg-notion-bg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-notion-text-secondary">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-notion-border rounded-lg hover:bg-notion-hover"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
