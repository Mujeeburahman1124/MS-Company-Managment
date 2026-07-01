import { create } from "zustand";
import { RecentPage } from "../lib/types";

interface NavigationState {
  recentPages: RecentPage[];
  addRecentPage: (page: Omit<RecentPage, "visitedAt">) => void;
  clearRecentPages: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  recentPages: [],
  addRecentPage: (page) =>
    set((state) => {
      // Remove page if already in recent to move it to the top
      const filtered = state.recentPages.filter((p) => p.path !== page.path);
      const newPage: RecentPage = {
        ...page,
        visitedAt: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        })
      };
      
      // Limit to last 8 pages
      return {
        recentPages: [newPage, ...filtered].slice(0, 8)
      };
    }),
  clearRecentPages: () => set({ recentPages: [] })
}));
