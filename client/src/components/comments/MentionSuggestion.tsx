import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

interface MentionSuggestionProps {
  query: string;
  workspaceId: string;
  onSelect: (user: User) => void;
  position: { top: number; left: number };
}

export const MentionSuggestion: React.FC<MentionSuggestionProps> = ({
  query,
  workspaceId,
  onSelect,
  position,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [query, workspaceId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/workspaces/${workspaceId}/members`);
      const members = response.data.data.members || [];

      // Filter members by query
      const filteredUsers = members
        .map((m: any) => m.user)
        .filter((user: User) => {
          const searchText = query.toLowerCase();
          return (
            user.name?.toLowerCase().includes(searchText) ||
            user.email.toLowerCase().includes(searchText)
          );
        });

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % users.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (users[selectedIndex]) {
          onSelect(users[selectedIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [users, selectedIndex, onSelect]);

  if (loading) {
    return (
      <div
        style={{
          position: 'absolute',
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 1000,
        }}
        className="bg-white border border-notion-border rounded-lg shadow-lg p-3 w-64"
      >
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-notion-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div
        style={{
          position: 'absolute',
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 1000,
        }}
        className="bg-white border border-notion-border rounded-lg shadow-lg p-3 w-64"
      >
        <div className="text-sm text-notion-text-secondary text-center">
          No users found
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
      }}
      className="bg-white border border-notion-border rounded-lg shadow-lg overflow-hidden w-64 max-h-64 overflow-y-auto"
    >
      {users.map((user, index) => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          onMouseEnter={() => setSelectedIndex(index)}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
            index === selectedIndex
              ? 'bg-blue-50 text-notion-blue'
              : 'hover:bg-notion-hover'
          }`}
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-notion-blue text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{(user.name || user.email)[0].toUpperCase()}</span>
            )}
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-notion-text truncate">
              {user.name || 'Unknown'}
            </div>
            <div className="text-xs text-notion-text-secondary truncate">
              {user.email}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
