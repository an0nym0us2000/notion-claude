import { create } from 'zustand';
import type { Page, Block } from '@/lib/types';

interface PageState {
  pages: Page[];
  currentPage: Page | null;
  blocks: Block[];
  setPages: (pages: Page[]) => void;
  setCurrentPage: (page: Page | null) => void;
  setBlocks: (blocks: Block[]) => void;
  addPage: (page: Page) => void;
  updatePage: (id: string, updates: Partial<Page>) => void;
  removePage: (id: string) => void;
  addBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  removeBlock: (id: string) => void;
}

export const usePageStore = create<PageState>((set) => ({
  pages: [],
  currentPage: null,
  blocks: [],

  setPages: (pages) => set({ pages }),

  setCurrentPage: (page) => {
    set({ currentPage: page, blocks: page?.blocks || [] });
  },

  setBlocks: (blocks) => set({ blocks }),

  addPage: (page) =>
    set((state) => ({
      pages: [...state.pages, page],
    })),

  updatePage: (id, updates) =>
    set((state) => ({
      pages: state.pages.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      currentPage: state.currentPage?.id === id ? { ...state.currentPage, ...updates } : state.currentPage,
    })),

  removePage: (id) =>
    set((state) => ({
      pages: state.pages.filter((p) => p.id !== id),
      currentPage: state.currentPage?.id === id ? null : state.currentPage,
    })),

  addBlock: (block) =>
    set((state) => ({
      blocks: [...state.blocks, block].sort((a, b) => a.order - b.order),
    })),

  updateBlock: (id, updates) =>
    set((state) => ({
      blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),

  removeBlock: (id) =>
    set((state) => ({
      blocks: state.blocks.filter((b) => b.id !== id),
    })),
}));
