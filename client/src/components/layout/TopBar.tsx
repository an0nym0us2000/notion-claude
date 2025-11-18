import React from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';

interface TopBarProps {
  pageTitle?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ pageTitle }) => {
  const { user } = useAuthStore();

  return (
    <div className="h-12 border-b border-notion-border bg-notion-bg flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        {/* Breadcrumb or page info */}
        {pageTitle && (
          <div className="text-sm text-notion-text-secondary">
            {pageTitle}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Share button placeholder */}
        <button className="px-3 py-1 text-sm text-notion-text-secondary hover:bg-notion-hover rounded">
          Share
        </button>

        {/* User avatar */}
        <Avatar src={user?.avatar} name={user?.name} size="sm" />
      </div>
    </div>
  );
};
