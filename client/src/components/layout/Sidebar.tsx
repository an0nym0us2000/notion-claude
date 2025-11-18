import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { usePageStore } from '@/stores/pageStore';
import { Button } from '@/components/ui/Button';
import { pageAPI } from '@/lib/api';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceStore();
  const { pages, addPage } = usePageStore();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePage = async () => {
    if (!currentWorkspace || isCreating) return;

    setIsCreating(true);
    try {
      const newPage = await pageAPI.create({
        workspaceId: currentWorkspace.id,
        title: 'Untitled',
      });
      addPage(newPage);
      navigate(`/page/${newPage.id}`);
    } catch (error) {
      console.error('Failed to create page:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-notion-sidebar h-screen bg-notion-bg-secondary border-r border-notion-border flex flex-col">
      {/* Workspace Header */}
      <div className="p-4 border-b border-notion-border">
        <div className="flex items-center gap-2">
          <div className="text-xl">{currentWorkspace?.icon || '📝'}</div>
          <div className="flex-1 truncate">
            <h2 className="font-semibold text-sm truncate">{currentWorkspace?.name || 'Workspace'}</h2>
          </div>
        </div>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreatePage}
            disabled={isCreating}
            className="w-full justify-start text-notion-text-secondary"
          >
            <span className="mr-2">+</span>
            New Page
          </Button>
        </div>

        <div className="space-y-0.5">
          {pages.map((page) => (
            <div
              key={page.id}
              onClick={() => navigate(`/page/${page.id}`)}
              className="notion-sidebar-item group"
            >
              <span className="text-sm">{page.icon || '📄'}</span>
              <span className="flex-1 truncate text-sm">{page.title || 'Untitled'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* User Section */}
      <div className="p-2 border-t border-notion-border">
        <div className="notion-sidebar-item">
          <span className="text-sm">👤</span>
          <span className="flex-1 truncate text-sm">Account</span>
        </div>
      </div>
    </div>
  );
};
