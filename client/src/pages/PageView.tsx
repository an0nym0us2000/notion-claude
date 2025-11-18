import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pageAPI, blockAPI } from '@/lib/api';
import { usePageStore } from '@/stores/pageStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { PageCanvas } from '@/components/layout/PageCanvas';
import { BlockList } from '@/components/blocks/BlockList';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export const PageView: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const { currentPage, setCurrentPage, blocks, addBlock } = usePageStore();
  const [title, setTitle] = useState('');
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);

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
        <TopBar pageTitle={currentPage.title} />
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
    </div>
  );
};
