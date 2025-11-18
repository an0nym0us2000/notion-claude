import axios from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
  Workspace,
  Page,
  Block,
} from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (credentials: RegisterCredentials) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', credentials);
    return data.data!;
  },

  login: async (credentials: LoginCredentials) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return data.data!;
  },

  getCurrentUser: async () => {
    const { data } = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return data.data!.user;
  },

  refreshToken: async (token: string) => {
    const { data } = await api.post<ApiResponse<{ token: string }>>('/auth/refresh', { token });
    return data.data!.token;
  },
};

// Workspace API
export const workspaceAPI = {
  getAll: async () => {
    const { data } = await api.get<ApiResponse<{ workspaces: Workspace[] }>>('/workspaces');
    return data.data!.workspaces;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<{ workspace: Workspace }>>(`/workspaces/${id}`);
    return data.data!.workspace;
  },

  create: async (payload: { name: string; icon?: string }) => {
    const { data } = await api.post<ApiResponse<{ workspace: Workspace }>>('/workspaces', payload);
    return data.data!.workspace;
  },

  update: async (id: string, payload: { name?: string; icon?: string }) => {
    const { data } = await api.patch<ApiResponse<{ workspace: Workspace }>>(`/workspaces/${id}`, payload);
    return data.data!.workspace;
  },

  delete: async (id: string) => {
    await api.delete(`/workspaces/${id}`);
  },

  addMember: async (id: string, payload: { email: string; role?: string }) => {
    const { data } = await api.post<ApiResponse<{ member: any }>>(`/workspaces/${id}/members`, payload);
    return data.data!.member;
  },
};

// Page API
export const pageAPI = {
  getAll: async (workspaceId: string, parentId?: string) => {
    const { data } = await api.get<ApiResponse<{ pages: Page[] }>>('/pages', {
      params: { workspaceId, parentId },
    });
    return data.data!.pages;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<{ page: Page }>>(`/pages/${id}`);
    return data.data!.page;
  },

  create: async (payload: {
    workspaceId: string;
    parentId?: string;
    title?: string;
    icon?: string;
    coverImage?: string;
  }) => {
    const { data } = await api.post<ApiResponse<{ page: Page }>>('/pages', payload);
    return data.data!.page;
  },

  update: async (
    id: string,
    payload: {
      title?: string;
      icon?: string;
      coverImage?: string;
      isPublished?: boolean;
    }
  ) => {
    const { data } = await api.patch<ApiResponse<{ page: Page }>>(`/pages/${id}`, payload);
    return data.data!.page;
  },

  delete: async (id: string) => {
    await api.delete(`/pages/${id}`);
  },
};

// Block API
export const blockAPI = {
  create: async (payload: {
    pageId: string;
    type: string;
    content?: any;
    properties?: any;
    parentId?: string;
    afterBlockId?: string;
  }) => {
    const { data } = await api.post<ApiResponse<{ block: Block }>>('/blocks', payload);
    return data.data!.block;
  },

  update: async (
    id: string,
    payload: {
      type?: string;
      content?: any;
      properties?: any;
    }
  ) => {
    const { data } = await api.patch<ApiResponse<{ block: Block }>>(`/blocks/${id}`, payload);
    return data.data!.block;
  },

  delete: async (id: string) => {
    await api.delete(`/blocks/${id}`);
  },

  reorder: async (payload: {
    blockId: string;
    afterBlockId?: string;
    parentId?: string;
    pageId: string;
  }) => {
    const { data } = await api.post<ApiResponse<{ block: Block }>>('/blocks/reorder', payload);
    return data.data!.block;
  },

  duplicate: async (id: string) => {
    const { data } = await api.post<ApiResponse<{ block: Block }>>(`/blocks/${id}/duplicate`);
    return data.data!.block;
  },
};

export default api;
