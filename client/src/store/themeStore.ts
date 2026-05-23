import { create } from 'zustand';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  hydrate: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('makanak-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    set({ theme: next });
  },

  hydrate: () => {
    const saved = localStorage.getItem('makanak-theme') as 'light' | 'dark' | null;
    const theme = saved || 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },
}));
