import { create } from "zustand";
import { SearchResult } from "../lib/types";
import { useAuthStore } from "./authStore";

interface SearchState {
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchQuery: "",
  searchResults: [],
  isSearching: false,
  setSearchQuery: (query) => set({ searchQuery: query }),
  performSearch: (query) => {
    if (query.trim().length < 2) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true });

    const q = query.toLowerCase().trim();
    const results: SearchResult[] = [];
    const db = useAuthStore.getState();

    // 1. Applicants (name, mobile, email, trackingCode)
    db.applicants.forEach((app) => {
      if (
        app.fullName.toLowerCase().includes(q) ||
        app.mobile.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q) ||
        app.trackingCode.toLowerCase().includes(q)
      ) {
        results.push({
          id: app.id,
          name: app.fullName,
          module: "Applicants",
          link: `/applicants/${app.id}`,
          subInfo: `${app.trackingCode} | ${app.status} | ${app.mobile}`,
          status: app.status
        });
      }
    });

    // 2. Staff (name, mobile, email, position)
    db.staff.forEach((stf) => {
      if (
        stf.name.toLowerCase().includes(q) ||
        stf.mobile.toLowerCase().includes(q) ||
        stf.email.toLowerCase().includes(q) ||
        stf.position.toLowerCase().includes(q)
      ) {
        results.push({
          id: stf.id,
          name: stf.name,
          module: "Staff",
          link: `/staff/${stf.id}`,
          subInfo: `${stf.position} | ${stf.status} | ${stf.email}`,
          status: stf.status
        });
      }
    });

    // 3. Companies (name, email, telephone)
    db.companies.forEach((comp) => {
      if (
        comp.name.toLowerCase().includes(q) ||
        comp.email.toLowerCase().includes(q) ||
        comp.telephone.toLowerCase().includes(q)
      ) {
        results.push({
          id: comp.id,
          name: comp.name,
          module: "Companies",
          link: `/companies`, // Redirect to companies list/profile
          subInfo: `${comp.email} | ${comp.telephone}`,
          status: comp.status
        });
      }
    });

    // 4. Vehicles (plateNumber, brand, assignedTo)
    db.vehicles.forEach((veh) => {
      if (
        veh.plateNumber.toLowerCase().includes(q) ||
        veh.brand.toLowerCase().includes(q) ||
        (veh.assignedTo && veh.assignedTo.toLowerCase().includes(q))
      ) {
        results.push({
          id: veh.id,
          name: `${veh.brand} (${veh.plateNumber})`,
          module: "Vehicles",
          link: `/vehicles`,
          subInfo: `Plate: ${veh.plateCode} | Status: ${veh.status} | ${veh.assignedTo || "Unassigned"}`
        });
      }
    });

    // 5. Users (name, email, mobile, role)
    db.users.forEach((usr) => {
      if (
        usr.name.toLowerCase().includes(q) ||
        usr.email.toLowerCase().includes(q) ||
        usr.mobile.toLowerCase().includes(q) ||
        usr.role.toLowerCase().includes(q)
      ) {
        results.push({
          id: usr.id,
          name: usr.name,
          module: "Users",
          link: `/users`,
          subInfo: `${usr.role} | ${usr.email} | ${usr.status}`
        });
      }
    });

    // 6. Suppliers (name, mobile, email)
    db.suppliers.forEach((sup) => {
      if (
        sup.name.toLowerCase().includes(q) ||
        sup.mobile.toLowerCase().includes(q) ||
        sup.email.toLowerCase().includes(q)
      ) {
        results.push({
          id: sup.id,
          name: sup.name,
          module: "Suppliers",
          link: `/suppliers`,
          subInfo: `${sup.email} | ${sup.mobile}`
        });
      }
    });

    // 7. Documents (name, uploadedBy)
    // Flatten applicant/staff/supplier documents to search
    const docs: { name: string; uploadedBy: string; source: string }[] = [];
    db.applicants.forEach((a) => a.documents.forEach((d) => docs.push({ name: d.name, uploadedBy: d.uploadedBy, source: `Applicant: ${a.fullName}` })));
    db.staff.forEach((s) => s.documents.forEach((d) => docs.push({ name: d.name, uploadedBy: d.uploadedBy, source: `Staff: ${s.name}` })));
    db.suppliers.forEach((s) => s.documents.forEach((d) => docs.push({ name: d.name, uploadedBy: d.uploadedBy, source: `Supplier: ${s.name}` })));

    docs.forEach((doc, idx) => {
      if (doc.name.toLowerCase().includes(q) || doc.uploadedBy.toLowerCase().includes(q)) {
        results.push({
          id: `DOC-${idx}`,
          name: doc.name,
          module: "Documents",
          link: `/documents`,
          subInfo: `Uploaded by ${doc.uploadedBy} | Source: ${doc.source}`
        });
      }
    });

    set({ searchResults: results.slice(0, 15), isSearching: false });
  },
  clearSearch: () => set({ searchQuery: "", searchResults: [], isSearching: false })
}));
