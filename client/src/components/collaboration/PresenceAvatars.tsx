import React, { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { YjsProvider } from '@/lib/yjsProvider';

interface UserPresence {
  id: string;
  email: string;
  name?: string;
  color: string;
}

interface PresenceAvatarsProps {
  provider: YjsProvider | null;
}

export const PresenceAvatars: React.FC<PresenceAvatarsProps> = ({ provider }) => {
  const [users, setUsers] = useState<UserPresence[]>([]);

  useEffect(() => {
    if (!provider) return;

    const awareness = provider.getAwareness();

    const updateUsers = () => {
      const states = awareness.getStates();
      const activeUsers: UserPresence[] = [];

      states.forEach((state: any, clientId: number) => {
        if (state.user) {
          activeUsers.push({
            id: state.user.id || String(clientId),
            email: state.user.email || 'Unknown',
            name: state.user.name,
            color: state.user.color || '#958DF1',
          });
        }
      });

      setUsers(activeUsers);
    };

    // Update on awareness changes
    awareness.on('change', updateUsers);
    updateUsers();

    return () => {
      awareness.off('change', updateUsers);
    };
  }, [provider]);

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user) => (
          <div
            key={user.id}
            className="relative"
            title={user.name || user.email}
          >
            <Avatar
              name={user.name || user.email}
              size="sm"
              className="border-2 border-white"
              style={{ backgroundColor: user.color }}
            />
            <div
              className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"
              title="Online"
            />
          </div>
        ))}
      </div>
      {users.length > 3 && (
        <span className="text-xs text-notion-text-secondary ml-1">
          +{users.length - 3} more
        </span>
      )}
    </div>
  );
};
