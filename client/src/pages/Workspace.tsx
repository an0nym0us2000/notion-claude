import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { workspaceAPI, pageAPI } from '@/lib/api';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { usePageStore } from '@/stores/pageStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { PageCanvas } from '@/components/layout/PageCanvas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

export const Workspace: React.FC = () => {
  const navigate = useNavigate();
  const { workspaces, setWorkspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const { setPages } = usePageStore();
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceAPI.getAll,
  });

  useEffect(() => {
    if (data) {
      setWorkspaces(data);
      if (data.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(data[0]);
      }
    }
  }, [data, setWorkspaces, currentWorkspace, setCurrentWorkspace]);

  useEffect(() => {
    const fetchPages = async () => {
      if (currentWorkspace) {
        try {
          const pages = await pageAPI.getAll(currentWorkspace.id);
          setPages(pages);
        } catch (error) {
          console.error('Failed to fetch pages:', error);
        }
      }
    };
    fetchPages();
  }, [currentWorkspace, setPages]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const workspace = await workspaceAPI.create({ name: newWorkspaceName });
      setWorkspaces([...workspaces, workspace]);
      setCurrentWorkspace(workspace);
      setNewWorkspaceName('');
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentWorkspace && workspaces.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-notion-bg-secondary">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border border-notion-border p-8">
            <h1 className="text-2xl font-bold text-notion-text mb-4">Create your first workspace</h1>
            <p className="text-notion-text-secondary mb-6">
              Workspaces help you organize your pages and collaborate with others.
            </p>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <Input
                placeholder="e.g., Personal, Work, Team Projects"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                disabled={isCreating}
              />

              <Button
                type="submit"
                variant="primary"
                disabled={isCreating || !newWorkspaceName.trim()}
                className="w-full"
              >
                {isCreating ? <Spinner size="sm" /> : 'Create Workspace'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <PageCanvas>
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-notion-text mb-4">
              Welcome to {currentWorkspace?.name}
            </h1>
            <p className="text-notion-text-secondary mb-8">
              Select a page from the sidebar or create a new one to get started.
            </p>
          </div>
        </PageCanvas>
      </div>
    </div>
  );
};
