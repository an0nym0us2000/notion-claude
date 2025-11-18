import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import type { Page, Block } from '@/lib/types';

export const SharedPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadSharedPage();
  }, [token]);

  const loadSharedPage = async (providedPassword?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/api/shared/${token}`, {
        params: { password: providedPassword },
      });

      const data = response.data.data;
      setPage(data.page);
      setBlocks(data.blocks || []);
      setPasswordRequired(false);
    } catch (err: any) {
      console.error('Error loading shared page:', err);

      if (err.response?.status === 401) {
        setPasswordRequired(true);
        setError('This page is password protected.');
      } else if (err.response?.status === 404) {
        setError('This share link does not exist or has expired.');
      } else if (err.response?.status === 410) {
        setError('This share link has expired.');
      } else {
        setError('Failed to load page. Please try again.');
      }
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setVerifying(true);
    await loadSharedPage(password);
  };

  if (loading && !passwordRequired) {
    return (
      <div className="min-h-screen bg-notion-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-notion-blue mx-auto mb-4"></div>
          <p className="text-notion-text-secondary">Loading shared page...</p>
        </div>
      </div>
    );
  }

  if (error && !passwordRequired) {
    return (
      <div className="min-h-screen bg-notion-bg flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-notion-text mb-2">
            Unable to Load Page
          </h1>
          <p className="text-notion-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-notion-bg flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-notion-text mb-2">
              Password Required
            </h1>
            <p className="text-notion-text-secondary">
              This page is password protected. Please enter the password to continue.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue"
                autoFocus
              />
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={verifying || !password.trim()}
              className="w-full px-4 py-3 bg-notion-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? 'Verifying...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="min-h-screen bg-notion-bg">
      {/* Header */}
      <div className="bg-white border-b border-notion-border">
        <div className="max-w-4xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{page.icon || '📄'}</span>
              <h1 className="text-2xl font-bold text-notion-text">
                {page.title || 'Untitled'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Shared Page
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {page.coverImage && (
        <div className="max-w-4xl mx-auto">
          <img
            src={page.coverImage}
            alt="Cover"
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {blocks.length === 0 ? (
          <div className="text-center py-12 text-notion-text-secondary">
            <div className="text-4xl mb-4">📝</div>
            <p>This page is empty</p>
          </div>
        ) : (
          <div className="space-y-1">
            {blocks
              .filter((block) => !block.parentId)
              .sort((a, b) => a.order - b.order)
              .map((block) => (
                <div key={block.id} className="relative group">
                  <BlockRenderer
                    block={block}
                    onUpdate={() => {}} // Read-only for public viewers
                    onEnter={() => {}}
                    onBackspace={() => {}}
                  />
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-8 py-8 border-t border-notion-border mt-12">
        <div className="text-center text-sm text-notion-text-secondary">
          <p>This is a shared page from a Notion-like workspace</p>
          <p className="mt-1">
            Last updated: {new Date(page.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};
