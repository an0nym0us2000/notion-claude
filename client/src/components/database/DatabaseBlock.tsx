import React, { useState, useEffect } from 'react';
import { Database, DatabaseView } from '@/lib/types';
import { api } from '@/lib/api';
import { TableView } from './TableView';
import { ListView } from './ListView';
import { BoardView } from './BoardView';

interface DatabaseBlockProps {
  blockId: string;
  onDelete?: () => void;
}

export const DatabaseBlock: React.FC<DatabaseBlockProps> = ({
  blockId,
  onDelete,
}) => {
  const [database, setDatabase] = useState<Database | null>(null);
  const [currentView, setCurrentView] = useState<DatabaseView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatabase();
  }, [blockId]);

  const loadDatabase = async () => {
    try {
      setLoading(true);
      setError(null);

      // Find database by blockId
      const response = await api.get(`/api/databases/${blockId}`);
      const dbData = response.data.data.database;

      setDatabase(dbData);

      // Set current view to default or first view
      const defaultView = dbData.views.find((v: DatabaseView) => v.isDefault) || dbData.views[0];
      setCurrentView(defaultView);
    } catch (err: any) {
      console.error('Error loading database:', err);
      setError(err.response?.data?.message || 'Failed to load database');
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (viewId: string) => {
    const view = database?.views.find((v) => v.id === viewId);
    if (view) {
      setCurrentView(view);
    }
  };

  const handleUpdateDatabase = async (updates: Partial<Database>) => {
    if (!database) return;

    try {
      await api.patch(`/api/databases/${database.id}`, updates);
      setDatabase({ ...database, ...updates });
    } catch (err) {
      console.error('Error updating database:', err);
    }
  };

  const handleAddProperty = async (name: string, type: string) => {
    if (!database) return;

    try {
      const response = await api.post(`/api/databases/${database.id}/properties`, {
        name,
        type,
      });
      const newProperty = response.data.data.property;
      setDatabase({
        ...database,
        properties: [...database.properties, newProperty],
      });
    } catch (err) {
      console.error('Error adding property:', err);
    }
  };

  const handleUpdateProperty = async (propertyId: string, updates: any) => {
    if (!database) return;

    try {
      await api.patch(`/api/databases/properties/${propertyId}`, updates);
      setDatabase({
        ...database,
        properties: database.properties.map((p) =>
          p.id === propertyId ? { ...p, ...updates } : p
        ),
      });
    } catch (err) {
      console.error('Error updating property:', err);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!database) return;

    try {
      await api.delete(`/api/databases/properties/${propertyId}`);
      setDatabase({
        ...database,
        properties: database.properties.filter((p) => p.id !== propertyId),
      });
    } catch (err) {
      console.error('Error deleting property:', err);
    }
  };

  const handleAddRow = async (values: Record<string, any> = {}) => {
    if (!database) return;

    try {
      const response = await api.post(`/api/databases/${database.id}/rows`, {
        values,
      });
      const newRow = response.data.data.row;
      setDatabase({
        ...database,
        rows: [...database.rows, newRow],
      });
    } catch (err) {
      console.error('Error adding row:', err);
    }
  };

  const handleUpdateRow = async (rowId: string, values: Record<string, any>) => {
    if (!database) return;

    try {
      await api.patch(`/api/databases/rows/${rowId}`, { values });
      setDatabase({
        ...database,
        rows: database.rows.map((r) =>
          r.id === rowId ? { ...r, values: { ...r.values, ...values } } : r
        ),
      });
    } catch (err) {
      console.error('Error updating row:', err);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!database) return;

    try {
      await api.delete(`/api/databases/rows/${rowId}`);
      setDatabase({
        ...database,
        rows: database.rows.filter((r) => r.id !== rowId),
      });
    } catch (err) {
      console.error('Error deleting row:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-notion-bg-secondary rounded">
        <div className="animate-pulse">
          <div className="h-8 bg-notion-hover rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-notion-hover rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !database || !currentView) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600">
        {error || 'Failed to load database'}
      </div>
    );
  }

  return (
    <div className="bg-notion-bg-secondary rounded-lg border border-notion-border">
      {/* Database Header */}
      <div className="px-4 py-3 border-b border-notion-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {database.icon && <span className="text-xl">{database.icon}</span>}
            <input
              type="text"
              value={database.name}
              onChange={(e) => handleUpdateDatabase({ name: e.target.value })}
              className="text-lg font-semibold bg-transparent border-none outline-none focus:bg-notion-hover px-2 py-1 rounded"
              placeholder="Database name"
            />
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-2">
            <select
              value={currentView.id}
              onChange={(e) => handleViewChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-notion-border rounded bg-white hover:bg-notion-hover"
            >
              {database.views.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </select>

            {onDelete && (
              <button
                onClick={onDelete}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Database View Content */}
      <div className="p-4">
        {currentView.type === 'table' && (
          <TableView
            database={database}
            view={currentView}
            onAddProperty={handleAddProperty}
            onUpdateProperty={handleUpdateProperty}
            onDeleteProperty={handleDeleteProperty}
            onAddRow={handleAddRow}
            onUpdateRow={handleUpdateRow}
            onDeleteRow={handleDeleteRow}
          />
        )}

        {currentView.type === 'list' && (
          <ListView
            database={database}
            view={currentView}
            onAddRow={handleAddRow}
            onUpdateRow={handleUpdateRow}
            onDeleteRow={handleDeleteRow}
          />
        )}

        {currentView.type === 'board' && (
          <BoardView
            database={database}
            view={currentView}
            onAddRow={handleAddRow}
            onUpdateRow={handleUpdateRow}
            onDeleteRow={handleDeleteRow}
          />
        )}
      </div>
    </div>
  );
};
