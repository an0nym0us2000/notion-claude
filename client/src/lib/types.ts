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
  | 'divider';

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
