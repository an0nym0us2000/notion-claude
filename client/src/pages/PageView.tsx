import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pageAPI, blockAPI, api } from '@/lib/api';
import { usePageStore } from '@/stores/pageStore';
import { useYjsCollaboration } from '@/hooks/useYjsCollaboration';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { PageCanvas } from '@/components/layout/PageCanvas';
import { BlockList } from '@/components/blocks/BlockList';
import { PresenceAvatars } from '@/components/collaboration/PresenceAvatars';
import { ConnectionStatus } from '@/components/collaboration/ConnectionStatus';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CommentSidebar } from '@/components/comments/CommentSidebar';

export const PageView: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const { currentPage, setCurrentPage, blocks, addBlock } = usePageStore();
  const [title, setTitle] = useState('');
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);
  const [isCommentSidebarOpen, setIsCommentSidebarOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  // Initialize Yjs collaboration
  const { ydoc, provider, synced, connected } = useYjsCollaboration(pageId);

  const { data, isLoading } = useQuery({
    queryKey: ['page', pageId],
    queryFn: () => pageAPI.getById(pageId!),
    enabled: !!pageId,
  });

  useEffect(() => {
    if (data) {
      setCurrentPage(data);
      setTitle(data.title);
    }
  }, [data, setCurrentPage]);

  // Load comment count
  useEffect(() => {
    if (pageId) {
      loadCommentCount();
    }
  }, [pageId]);

  const loadCommentCount = async () => {
    try {
      const response = await api.get(`/api/comments`, {
        params: { pageId },
      });
      const comments = response.data.data.comments || [];
      setCommentCount(comments.length);
    } catch (error) {
      console.error('Error loading comment count:', error);
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    if (!pageId || isUpdatingTitle) return;

    setIsUpdatingTitle(true);
    try {
      await pageAPI.update(pageId, { title: newTitle });
    } catch (error) {
      console.error('Failed to update title:', error);
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const handleAddBlock = async () => {
    if (!pageId) return;

    try {
      const newBlock = await blockAPI.create({
        pageId,
        type: 'text',
        content: '',
      });
      addBlock(newBlock);
    } catch (error) {
      console.error('Failed to create block:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-notion-text-secondary">Page not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar
          pageTitle={currentPage.title}
          presenceAvatars={<PresenceAvatars provider={provider} />}
          connectionStatus={<ConnectionStatus connected={connected} synced={synced} />}
          onCommentsClick={() => setIsCommentSidebarOpen(true)}
          commentCount={commentCount}
        />
        <PageCanvas>
          {/* Page icon */}
          {currentPage.icon && (
            <div className="text-6xl mb-4">{currentPage.icon}</div>
          )}

          {/* Page title */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="w-full text-4xl font-bold outline-none mb-8 bg-transparent"
          />

          {/* Blocks */}
          <BlockList blocks={blocks} pageId={pageId!} />

          {/* Add block button */}
          <div className="mt-4">
            <Button variant="ghost" size="sm" onClick={handleAddBlock}>
              <span className="mr-2">+</span>
              Add a block
            </Button>
          </div>
        </PageCanvas>
      </div>

      {/* Comment Sidebar */}
      <CommentSidebar
        pageId={pageId!}
        workspaceId={currentPage?.workspaceId}
        isOpen={isCommentSidebarOpen}
        onClose={() => setIsCommentSidebarOpen(false)}
      />
    </div>
  );
};
