import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface WorkspaceMember {
  id: string;
  userId: string;
  role: string;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
    canInvite: boolean;
    canCreatePage: boolean;
    canDeletePage: boolean;
  };
  user: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
}

interface PermissionsSettingsProps {
  workspaceId: string;
  currentUserId: string;
  onClose: () => void;
}

const ROLE_PRESETS = {
  owner: {
    canEdit: true,
    canComment: true,
    canShare: true,
    canInvite: true,
    canCreatePage: true,
    canDeletePage: true,
  },
  admin: {
    canEdit: true,
    canComment: true,
    canShare: true,
    canInvite: true,
    canCreatePage: true,
    canDeletePage: true,
  },
  member: {
    canEdit: true,
    canComment: true,
    canShare: false,
    canInvite: false,
    canCreatePage: true,
    canDeletePage: false,
  },
  viewer: {
    canEdit: false,
    canComment: true,
    canShare: false,
    canInvite: false,
    canCreatePage: false,
    canDeletePage: false,
  },
};

export const PermissionsSettings: React.FC<PermissionsSettingsProps> = ({
  workspaceId,
  currentUserId,
  onClose,
}) => {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, [workspaceId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/workspaces/${workspaceId}/members`);
      setMembers(response.data.data.members || []);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const permissions = ROLE_PRESETS[newRole as keyof typeof ROLE_PRESETS];

      await api.patch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        role: newRole,
        permissions,
      });

      // Update local state
      setMembers(
        members.map((m) =>
          m.id === memberId ? { ...m, role: newRole, permissions } : m
        )
      );
    } catch (error) {
      console.error('Error updating member role:', error);
      alert('Failed to update member role. Please try again.');
    }
  };

  const handlePermissionToggle = async (
    memberId: string,
    permission: keyof WorkspaceMember['permissions']
  ) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    try {
      const updatedPermissions = {
        ...member.permissions,
        [permission]: !member.permissions[permission],
      };

      await api.patch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        permissions: updatedPermissions,
      });

      // Update local state
      setMembers(
        members.map((m) =>
          m.id === memberId ? { ...m, permissions: updatedPermissions } : m
        )
      );
    } catch (error) {
      console.error('Error updating permission:', error);
      alert('Failed to update permission. Please try again.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member || !confirm(`Remove ${member.user.name || member.user.email} from workspace?`)) {
      return;
    }

    try {
      await api.delete(`/api/workspaces/${workspaceId}/members/${memberId}`);
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-notion-border flex items-center justify-between">
          <h2 className="text-2xl font-bold">Workspace Permissions</h2>
          <button
            onClick={onClose}
            className="text-notion-text-secondary hover:text-notion-text-primary text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-notion-text-secondary">
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-notion-text-secondary">
              <div className="text-4xl mb-4">👥</div>
              <p>No members found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                const isEditing = editingMember === member.id;

                return (
                  <div
                    key={member.id}
                    className="border border-notion-border rounded-lg p-4"
                  >
                    {/* Member Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-notion-blue text-white flex items-center justify-center font-semibold">
                          {member.user.avatar ? (
                            <img
                              src={member.user.avatar}
                              alt={member.user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span>
                              {(member.user.name || member.user.email)[0].toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div>
                          <div className="font-semibold text-notion-text">
                            {member.user.name || 'Unnamed User'}
                            {isCurrentUser && (
                              <span className="ml-2 text-sm text-notion-text-secondary">
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-notion-text-secondary">
                            {member.user.email}
                          </div>
                        </div>
                      </div>

                      {/* Role Selector */}
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          disabled={isCurrentUser || member.role === 'owner'}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getRoleBadgeColor(
                            member.role
                          )} border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>

                        <button
                          onClick={() => setEditingMember(isEditing ? null : member.id)}
                          className="px-3 py-1.5 text-sm text-notion-text-secondary hover:text-notion-text-primary"
                        >
                          {isEditing ? '▲' : '▼'}
                        </button>

                        {!isCurrentUser && member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Detailed Permissions */}
                    {isEditing && (
                      <div className="mt-4 pt-4 border-t border-notion-border">
                        <h4 className="text-sm font-semibold mb-3 text-notion-text-secondary">
                          Custom Permissions
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(member.permissions).map(([key, value]) => (
                            <label
                              key={key}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={() =>
                                  handlePermissionToggle(
                                    member.id,
                                    key as keyof WorkspaceMember['permissions']
                                  )
                                }
                                disabled={isCurrentUser || member.role === 'owner'}
                                className="w-4 h-4 rounded border-notion-border text-notion-blue focus:ring-notion-blue"
                              />
                              <span className="text-sm capitalize">
                                {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Member Since */}
                    <div className="mt-3 text-xs text-notion-text-tertiary">
                      Member since {new Date(member.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-notion-border flex justify-end">
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
