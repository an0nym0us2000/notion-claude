import React from 'react';

interface ConnectionStatusProps {
  connected: boolean;
  synced: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connected,
  synced,
}) => {
  if (synced) {
    return (
      <div className="flex items-center gap-2 text-xs text-notion-text-secondary">
        <div className="w-2 h-2 bg-green-500 rounded-full" title="Synced" />
        <span>Saved</span>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center gap-2 text-xs text-notion-text-secondary">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Syncing" />
        <span>Syncing...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-red-600">
      <div className="w-2 h-2 bg-red-500 rounded-full" title="Offline" />
      <span>Offline</span>
    </div>
  );
};
