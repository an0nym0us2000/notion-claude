export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string | null;
  members: WorkspaceMember[];
  pages?: Page[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  user: User;
  createdAt: string;
}

export interface Page {
  id: string;
  title: string;
  icon: string | null;
  coverImage: string | null;
  workspaceId: string;
  parentId: string | null;
  childPages?: Page[];
  blocks?: Block[];
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type BlockType =
  | 'text'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'todo'
  | 'bullet'
  | 'number'
  | 'quote'
  | 'code'
  | 'divider'
  | 'database';

export interface Block {
  id: string;
  type: BlockType;
  content: any; // Tiptap JSON content
  properties?: {
    checked?: boolean;
    language?: string;
    [key: string]: any;
  };
  pageId: string;
  parentId: string | null;
  childBlocks?: Block[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

// Database types
export type PropertyType =
  | 'text'
  | 'number'
  | 'select'
  | 'multi-select'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'relation';

export interface DatabaseProperty {
  id: string;
  databaseId: string;
  name: string;
  type: PropertyType;
  config?: {
    options?: { id: string; name: string; color: string }[];
    relationDatabaseId?: string;
    format?: string;
  };
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseRow {
  id: string;
  databaseId: string;
  pageId?: string | null;
  values: Record<string, any>;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type ViewType = 'table' | 'list' | 'board' | 'calendar' | 'gallery';

export interface DatabaseView {
  id: string;
  databaseId: string;
  name: string;
  type: ViewType;
  config: {
    filters?: Filter[];
    sorts?: Sort[];
    groupBy?: string;
    hiddenProperties?: string[];
  };
  order: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Database {
  id: string;
  blockId: string;
  name: string;
  icon?: string | null;
  properties: DatabaseProperty[];
  rows: DatabaseRow[];
  views: DatabaseView[];
  createdAt: string;
  updatedAt: string;
}

export interface Filter {
  id: string;
  propertyId: string;
  operator: string;
  value: any;
}

export interface Sort {
  id: string;
  propertyId: string;
  direction: 'asc' | 'desc';
}
