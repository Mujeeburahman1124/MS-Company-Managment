import { create } from "zustand";
import { ModuleFilter } from "../lib/types";
import { DEFAULT_FILTER_STATE } from "../lib/constants";

interface FilterState {
  // Store filter configuration by module key
  filters: { [moduleKey: string]: ModuleFilter };
  setFilter: (moduleKey: string, newFilters: Partial<ModuleFilter>) => void;
  clearFilter: (moduleKey: string) => void;
  resetFilters: () => void;
}

const initialFilters = {
  applicants: { ...DEFAULT_FILTER_STATE },
  staff: { ...DEFAULT_FILTER_STATE },
  companies: { ...DEFAULT_FILTER_STATE },
  branches: { ...DEFAULT_FILTER_STATE },
  users: { ...DEFAULT_FILTER_STATE },
  roles: { ...DEFAULT_FILTER_STATE },
  tasks: { ...DEFAULT_FILTER_STATE },
  interviews: { ...DEFAULT_FILTER_STATE },
  leave: { ...DEFAULT_FILTER_STATE },
  requests: { ...DEFAULT_FILTER_STATE },
  vehicles: { ...DEFAULT_FILTER_STATE },
  documents: { ...DEFAULT_FILTER_STATE },
  suppliers: { ...DEFAULT_FILTER_STATE },
  placement: { ...DEFAULT_FILTER_STATE },
  members: { ...DEFAULT_FILTER_STATE },
  visaExpiry: { ...DEFAULT_FILTER_STATE },
  birthday: { ...DEFAULT_FILTER_STATE },
  attendance: { ...DEFAULT_FILTER_STATE },
  payroll: { ...DEFAULT_FILTER_STATE },
  notifications: { ...DEFAULT_FILTER_STATE },
  activityLog: { ...DEFAULT_FILTER_STATE },
  forms: { ...DEFAULT_FILTER_STATE },
  tracking: { ...DEFAULT_FILTER_STATE },
  reports: { ...DEFAULT_FILTER_STATE }
};

export const useFilterStore = create<FilterState>((set) => ({
  filters: initialFilters,
  setFilter: (moduleKey, newFilters) =>
    set((state) => {
      const currentModuleFilters = state.filters[moduleKey] || { ...DEFAULT_FILTER_STATE };
      return {
        filters: {
          ...state.filters,
          [moduleKey]: {
            ...currentModuleFilters,
            ...newFilters
          }
        }
      };
    }),
  clearFilter: (moduleKey) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [moduleKey]: { ...DEFAULT_FILTER_STATE }
      }
    })),
  resetFilters: () => set({ filters: initialFilters })
}));
export { DEFAULT_FILTER_STATE };
