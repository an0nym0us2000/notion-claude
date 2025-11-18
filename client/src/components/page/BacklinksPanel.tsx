import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

interface Backlink {
  id: string;
  sourcePageId: string;
  sourcePage: {
    id: string;
    title: string;
    icon?: string;
    updatedAt: string;
  };
  blockId?: string;
}

interface BacklinksPanelProps {
  pageId: string;
  workspaceId: string;
}

export const BacklinksPanel: React.FC<BacklinksPanelProps> = ({
  pageId,
  workspaceId,
}) => {
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadBacklinks();
  }, [pageId]);

  const loadBacklinks = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/search/backlinks/${pageId}`);
      setBacklinks(response.data.data.backlinks || []);
    } catch (error) {
      console.error('Error loading backlinks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBacklinkClick = (link: Backlink) => {
    const url = `/workspace/${workspaceId}/page/${link.sourcePageId}`;
    const hash = link.blockId ? `#${link.blockId}` : '';
    navigate(url + hash);
  };

  if (loading) {
    return (
      <div className="border-t border-notion-border">
        <div className="p-4 text-sm text-notion-text-secondary">
          Loading backlinks...
        </div>
      </div>
    );
  }

  if (backlinks.length === 0) {
    return null; // Don't show panel if no backlinks
  }

  return (
    <div className="border-t border-notion-border">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-notion-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-notion-text-secondary">
            Backlinks
          </span>
          <span className="px-2 py-0.5 text-xs bg-notion-bg rounded text-notion-text-tertiary">
            {backlinks.length}
          </span>
        </div>
        <span
          className={`text-notion-text-tertiary transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {/* Backlinks List */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {backlinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleBacklinkClick(link)}
              className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-notion-hover transition-colors text-left group"
            >
              <span className="text-xl flex-shrink-0">
                {link.sourcePage.icon || '📄'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-notion-text group-hover:text-notion-blue truncate">
                  {link.sourcePage.title || 'Untitled'}
                </div>
                <div className="text-xs text-notion-text-tertiary mt-1">
                  {new Date(link.sourcePage.updatedAt).toLocaleDateString()}
                  {link.blockId && ' · Has context'}
                </div>
              </div>
              <span className="text-notion-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
