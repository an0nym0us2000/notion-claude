import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface SearchResult {
  id: string;
  title?: string;
  content?: any;
  type: 'page' | 'block';
  pageId?: string;
  page?: {
    id: string;
    title: string;
    icon?: string;
  };
  icon?: string;
  updatedAt: string;
}

interface GlobalSearchProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  workspaceId,
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    pages: SearchResult[];
    blocks: SearchResult[];
  }>({ pages: [], blocks: [] });
  const [recentPages, setRecentPages] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load recent pages on mount
  useEffect(() => {
    if (isOpen && workspaceId) {
      loadRecentPages();
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, workspaceId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const maxIndex = getAllResults().length - 1;
          return prev < maxIndex ? prev + 1 : 0;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const maxIndex = getAllResults().length - 1;
          return prev > 0 ? prev - 1 : maxIndex;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const allResults = getAllResults();
        if (allResults[selectedIndex]) {
          handleSelectResult(allResults[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results, recentPages]);

  const loadRecentPages = async () => {
    try {
      const response = await api.get('/api/search/recent', {
        params: { workspaceId, limit: 10 },
      });
      setRecentPages(response.data.data.pages || []);
    } catch (error) {
      console.error('Error loading recent pages:', error);
    }
  };

  const searchWorkspace = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ pages: [], blocks: [] });
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/api/search/workspace', {
        params: {
          workspaceId,
          query: searchQuery,
          limit: 20,
        },
      });

      setResults(response.data.data.results || { pages: [], blocks: [] });
    } catch (error) {
      console.error('Error searching:', error);
      setResults({ pages: [], blocks: [] });
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        searchWorkspace(query);
      } else {
        setResults({ pages: [], blocks: [] });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, workspaceId]);

  const getAllResults = () => {
    if (!query) {
      return recentPages;
    }
    return [...results.pages, ...results.blocks];
  };

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'page') {
      navigate(`/workspace/${workspaceId}/page/${result.id}`);
    } else if (result.type === 'block' && result.pageId) {
      navigate(`/workspace/${workspaceId}/page/${result.pageId}#${result.id}`);
    }
    onClose();
    setQuery('');
  };

  const getResultText = (result: SearchResult) => {
    if (result.type === 'page') {
      return result.title || 'Untitled';
    } else if (result.type === 'block') {
      // Extract text from block content
      const content = result.content;
      if (typeof content === 'object' && content.content) {
        const text = extractTextFromContent(content);
        return text.substring(0, 100) + (text.length > 100 ? '...' : '');
      }
      return 'Block';
    }
    return '';
  };

  const extractTextFromContent = (content: any): string => {
    if (!content || !content.content) return '';
    return content.content
      .map((node: any) => node.text || '')
      .join(' ')
      .trim();
  };

  if (!isOpen) return null;

  const allResults = getAllResults();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-notion-border">
          <span className="text-notion-text-tertiary mr-3">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search for pages, blocks, or press Cmd+K"
            className="flex-1 outline-none text-base"
          />
          {loading && (
            <span className="text-xs text-notion-text-tertiary">Searching...</span>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {!query && recentPages.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-notion-text-tertiary">
                RECENT PAGES
              </div>
              {recentPages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => handleSelectResult(page)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left ${
                    selectedIndex === index
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-notion-hover'
                  }`}
                >
                  <span className="text-xl">{page.icon || '📄'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{page.title || 'Untitled'}</div>
                    <div className="text-xs text-notion-text-tertiary">
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query && results.pages.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-notion-text-tertiary">
                PAGES ({results.pages.length})
              </div>
              {results.pages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => handleSelectResult(page)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left ${
                    selectedIndex === index
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-notion-hover'
                  }`}
                >
                  <span className="text-xl">{page.icon || '📄'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{getResultText(page)}</div>
                    <div className="text-xs text-notion-text-tertiary">Page</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query && results.blocks.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-notion-text-tertiary">
                BLOCKS ({results.blocks.length})
              </div>
              {results.blocks.map((block, index) => {
                const resultIndex = results.pages.length + index;
                return (
                  <button
                    key={block.id}
                    onClick={() => handleSelectResult(block)}
                    onMouseEnter={() => setSelectedIndex(resultIndex)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left ${
                      selectedIndex === resultIndex
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-notion-hover'
                    }`}
                  >
                    <span className="text-xl">{block.page?.icon || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{getResultText(block)}</div>
                      <div className="text-xs text-notion-text-tertiary">
                        in {block.page?.title || 'Untitled'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {query && !loading && allResults.length === 0 && (
            <div className="p-8 text-center text-notion-text-tertiary">
              <div className="text-4xl mb-2">🔍</div>
              <div>No results found for "{query}"</div>
            </div>
          )}

          {!query && recentPages.length === 0 && (
            <div className="p-8 text-center text-notion-text-tertiary">
              <div className="text-4xl mb-2">🔍</div>
              <div>Start typing to search...</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-notion-border bg-notion-bg flex items-center justify-between text-xs text-notion-text-tertiary">
          <div className="flex gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div>
            <kbd className="px-2 py-1 bg-white border border-notion-border rounded">
              Cmd+K
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
