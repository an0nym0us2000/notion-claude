import { create } from 'zustand';
import type { Page, Block } from '@/lib/types';

interface PageState {
  pages: Page[];
  currentPage: Page | null;
  blocks: Block[];
  selectedBlocks: Set<string>;
  setPages: (pages: Page[]) => void;
  setCurrentPage: (page: Page | null) => void;
  setBlocks: (blocks: Block[]) => void;
  addPage: (page: Page) => void;
  updatePage: (id: string, updates: Partial<Page>) => void;
  removePage: (id: string) => void;
  addBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  // Block selection methods
  toggleBlockSelection: (blockId: string) => void;
  selectBlock: (blockId: string) => void;
  deselectBlock: (blockId: string) => void;
  selectAllBlocks: () => void;
  clearSelection: () => void;
  selectBlockRange: (fromId: string, toId: string) => void;
}

export const usePageStore = create<PageState>((set) => ({
  pages: [],
  currentPage: null,
  blocks: [],
  selectedBlocks: new Set(),

  setPages: (pages) => set({ pages }),

  setCurrentPage: (page) => {
    set({ currentPage: page, blocks: page?.blocks || [], selectedBlocks: new Set() });
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
      selectedBlocks: new Set([...state.selectedBlocks].filter((bid) => bid !== id)),
    })),

  // Block selection methods
  toggleBlockSelection: (blockId) =>
    set((state) => {
      const newSelected = new Set(state.selectedBlocks);
      if (newSelected.has(blockId)) {
        newSelected.delete(blockId);
      } else {
        newSelected.add(blockId);
      }
      return { selectedBlocks: newSelected };
    }),

  selectBlock: (blockId) =>
    set((state) => ({
      selectedBlocks: new Set(state.selectedBlocks).add(blockId),
    })),

  deselectBlock: (blockId) =>
    set((state) => {
      const newSelected = new Set(state.selectedBlocks);
      newSelected.delete(blockId);
      return { selectedBlocks: newSelected };
    }),

  selectAllBlocks: () =>
    set((state) => ({
      selectedBlocks: new Set(state.blocks.map((b) => b.id)),
    })),

  clearSelection: () =>
    set({ selectedBlocks: new Set() }),

  selectBlockRange: (fromId, toId) =>
    set((state) => {
      const sortedBlocks = [...state.blocks].sort((a, b) => a.order - b.order);
      const fromIndex = sortedBlocks.findIndex((b) => b.id === fromId);
      const toIndex = sortedBlocks.findIndex((b) => b.id === toId);

      if (fromIndex === -1 || toIndex === -1) return state;

      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      const rangeIds = sortedBlocks.slice(start, end + 1).map((b) => b.id);

      return {
        selectedBlocks: new Set([...state.selectedBlocks, ...rangeIds]),
      };
    }),
}));
