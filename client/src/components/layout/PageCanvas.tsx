import React from 'react';

interface PageCanvasProps {
  children: React.ReactNode;
}

export const PageCanvas: React.FC<PageCanvasProps> = ({ children }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-notion-bg">
      <div className="max-w-3xl mx-auto px-24 py-16">
        {children}
      </div>
    </div>
  );
};
