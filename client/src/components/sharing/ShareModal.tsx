import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface PageShare {
  id: string;
  token: string;
  password?: string;
  expiresAt?: string;
  allowEdit: boolean;
  allowComment: boolean;
  createdAt: string;
}

interface ShareModalProps {
  pageId: string;
  pageTitle: string;
  workspaceId: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  pageId,
  pageTitle,
  workspaceId,
  onClose,
}) => {
  const [share, setShare] = useState<PageShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState<'never' | '1day' | '7days' | '30days'>('never');
  const [allowEdit, setAllowEdit] = useState(false);
  const [allowComment, setAllowComment] = useState(true);

  useEffect(() => {
    loadShare();
  }, [pageId]);

  const loadShare = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/pages/${pageId}/share`);
      const existingShare = response.data.data.share;
      if (existingShare) {
        setShare(existingShare);
        setPassword(existingShare.password || '');
        setAllowEdit(existingShare.allowEdit);
        setAllowComment(existingShare.allowComment);
      }
    } catch (error: any) {
      // No share exists yet, that's fine
      if (error.response?.status !== 404) {
        console.error('Error loading share:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShare = async () => {
    try {
      setCreating(true);

      let expiresAt: Date | undefined;
      if (expiresIn !== 'never') {
        const daysToAdd = expiresIn === '1day' ? 1 : expiresIn === '7days' ? 7 : 30;
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + daysToAdd);
      }

      const response = await api.post(`/api/pages/${pageId}/share`, {
        password: password || undefined,
        expiresAt: expiresAt?.toISOString(),
        allowEdit,
        allowComment,
      });

      setShare(response.data.data.share);
    } catch (error) {
      console.error('Error creating share:', error);
      alert('Failed to create share link. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateShare = async () => {
    if (!share) return;

    try {
      setCreating(true);

      let expiresAt: Date | undefined;
      if (expiresIn !== 'never') {
        const daysToAdd = expiresIn === '1day' ? 1 : expiresIn === '7days' ? 7 : 30;
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + daysToAdd);
      }

      const response = await api.patch(`/api/pages/${pageId}/share`, {
        password: password || undefined,
        expiresAt: expiresAt?.toISOString(),
        allowEdit,
        allowComment,
      });

      setShare(response.data.data.share);
    } catch (error) {
      console.error('Error updating share:', error);
      alert('Failed to update share settings. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteShare = async () => {
    if (!share || !confirm('Remove public access to this page?')) return;

    try {
      await api.delete(`/api/pages/${pageId}/share`);
      setShare(null);
      setPassword('');
    } catch (error) {
      console.error('Error deleting share:', error);
      alert('Failed to remove share link. Please try again.');
    }
  };

  const handleCopyLink = () => {
    if (!share) return;

    const shareUrl = `${window.location.origin}/shared/${share.token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getShareUrl = () => {
    if (!share) return '';
    return `${window.location.origin}/shared/${share.token}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="p-4 border-b border-notion-border flex items-center justify-between">
          <h3 className="text-lg font-semibold">Share "{pageTitle}"</h3>
          <button
            onClick={onClose}
            className="text-notion-text-secondary hover:text-notion-text-primary"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-notion-text-secondary">
              Loading share settings...
            </div>
          ) : share ? (
            <>
              {/* Share Link */}
              <div>
                <label className="block text-sm font-medium text-notion-text-secondary mb-2">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={getShareUrl()}
                    readOnly
                    className="flex-1 px-3 py-2 border border-notion-border rounded-lg bg-notion-bg text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-notion-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-3">
                {/* Password Protection */}
                <div>
                  <label className="block text-sm font-medium text-notion-text-secondary mb-1">
                    Password Protection (Optional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue"
                  />
                </div>

                {/* Expiration */}
                <div>
                  <label className="block text-sm font-medium text-notion-text-secondary mb-1">
                    Link Expiration
                  </label>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value as any)}
                    className="w-full px-3 py-2 border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue"
                  >
                    <option value="never">Never</option>
                    <option value="1day">1 day</option>
                    <option value="7days">7 days</option>
                    <option value="30days">30 days</option>
                  </select>
                </div>

                {/* Permissions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="allowEdit"
                      checked={allowEdit}
                      onChange={(e) => setAllowEdit(e.target.checked)}
                      className="w-4 h-4 rounded border-notion-border text-notion-blue focus:ring-notion-blue"
                    />
                    <label htmlFor="allowEdit" className="text-sm cursor-pointer">
                      <span className="font-medium">Allow editing</span>
                      <p className="text-xs text-notion-text-secondary">
                        Anyone with the link can edit this page
                      </p>
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="allowComment"
                      checked={allowComment}
                      onChange={(e) => setAllowComment(e.target.checked)}
                      className="w-4 h-4 rounded border-notion-border text-notion-blue focus:ring-notion-blue"
                    />
                    <label htmlFor="allowComment" className="text-sm cursor-pointer">
                      <span className="font-medium">Allow comments</span>
                      <p className="text-xs text-notion-text-secondary">
                        Anyone with the link can add comments
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleUpdateShare}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-notion-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {creating ? 'Updating...' : 'Update Settings'}
                </button>
                <button
                  onClick={handleDeleteShare}
                  className="px-4 py-2 border border-notion-border text-red-600 rounded-lg hover:bg-red-50"
                >
                  Remove Link
                </button>
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <strong>Share created:</strong> {new Date(share.createdAt).toLocaleDateString()}
                {share.expiresAt && (
                  <div>
                    <strong>Expires:</strong> {new Date(share.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Create Share Form */}
              <div className="space-y-3">
                <p className="text-sm text-notion-text-secondary">
                  Create a public share link for this page. Anyone with the link will be able to view it.
                </p>

                {/* Password Protection */}
                <div>
                  <label className="block text-sm font-medium text-notion-text-secondary mb-1">
                    Password Protection (Optional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue"
                  />
                </div>

                {/* Expiration */}
                <div>
                  <label className="block text-sm font-medium text-notion-text-secondary mb-1">
                    Link Expiration
                  </label>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value as any)}
                    className="w-full px-3 py-2 border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue"
                  >
                    <option value="never">Never</option>
                    <option value="1day">1 day</option>
                    <option value="7days">7 days</option>
                    <option value="30days">30 days</option>
                  </select>
                </div>

                {/* Permissions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="allowEditCreate"
                      checked={allowEdit}
                      onChange={(e) => setAllowEdit(e.target.checked)}
                      className="w-4 h-4 rounded border-notion-border text-notion-blue focus:ring-notion-blue"
                    />
                    <label htmlFor="allowEditCreate" className="text-sm cursor-pointer">
                      <span className="font-medium">Allow editing</span>
                      <p className="text-xs text-notion-text-secondary">
                        Anyone with the link can edit this page
                      </p>
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="allowCommentCreate"
                      checked={allowComment}
                      onChange={(e) => setAllowComment(e.target.checked)}
                      className="w-4 h-4 rounded border-notion-border text-notion-blue focus:ring-notion-blue"
                    />
                    <label htmlFor="allowCommentCreate" className="text-sm cursor-pointer">
                      <span className="font-medium">Allow comments</span>
                      <p className="text-xs text-notion-text-secondary">
                        Anyone with the link can add comments
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateShare}
                disabled={creating}
                className="w-full px-4 py-2 bg-notion-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Share Link'}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-notion-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-notion-border rounded-lg hover:bg-notion-hover"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
