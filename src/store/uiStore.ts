import { create } from 'zustand';

interface UIState {
  activeRibbonTab: string;
  setActiveRibbonTab: (tab: string) => void;

  // Centralized Modal Management
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;

  viewMode: '3d' | 'spreadsheet' | 'report';
  setViewMode: (mode: '3d' | 'spreadsheet' | 'report') => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeRibbonTab: 'Structure',
  setActiveRibbonTab: (tab) => set({ activeRibbonTab: tab }),

  activeModal: null,
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),

  viewMode: '3d',
  setViewMode: (mode) => set({ viewMode: mode }),
}));
