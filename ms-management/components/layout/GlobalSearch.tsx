"use strict";
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { useSearchStore } from "@/store/searchStore";
import { useNavigationStore } from "@/store/navigationStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const {
    searchQuery,
    searchResults,
    isSearching,
    setSearchQuery,
    performSearch,
    clearSearch
  } = useSearchStore();

  const { addRecentPage } = useNavigationStore();

  // Close desktop search results dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    performSearch(val);
    setIsOpen(true);
  };

  const handleResultClick = (link: string, title: string, moduleName: string) => {
    setIsOpen(false);
    setIsMobileSearchOpen(false);
    clearSearch();
    
    // Add page to navigation store history
    let icon = "📄";
    if (moduleName === "Applicants") icon = "👤";
    else if (moduleName === "Staff") icon = "👔";
    else if (moduleName === "Companies") icon = "🏢";
    else if (moduleName === "Vehicles") icon = "🚗";
    else if (moduleName === "Users") icon = "👤";
    else if (moduleName === "Suppliers") icon = "🤝";
    
    addRecentPage({ path: link, title, icon });
    router.push(link);
  };

  // Group results by module
  const groupedResults = searchResults.reduce((acc, result) => {
    if (!acc[result.module]) {
      acc[result.module] = [];
    }
    acc[result.module].push(result);
    return acc;
  }, {} as Record<string, typeof searchResults>);

  return (
    <div className="relative flex items-center" ref={searchContainerRef}>
      {/* DESKTOP SEARCH BAR */}
      <div className="hidden md:flex items-center">
        <div
          className={cn(
            "flex items-center bg-slate-50 border border-slate-200 rounded-xl transition-all duration-300 px-3 py-1.5",
            isOpen ? "w-[300px] border-blue-400 ring-2 ring-blue-100" : "w-[180px] hover:w-[220px]"
          )}
        >
          <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Quick search..."
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            className="w-full bg-transparent border-none outline-none text-xs text-slate-700 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                clearSearch();
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-slate-600 ml-1.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Desktop Dropdown */}
        {isOpen && searchQuery.length >= 2 && (
          <div className="absolute top-12 right-0 w-[400px] bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 max-h-[450px] overflow-y-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                Searching...
              </div>
            ) : Object.keys(groupedResults).length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No results found for &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              <div className="space-y-3 p-1">
                {Object.entries(groupedResults).map(([moduleName, items]) => (
                  <div key={moduleName} className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 px-2 py-0.5 tracking-wider uppercase bg-slate-50/50 rounded-md">
                      {moduleName} ({items.length})
                    </div>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item.link, item.name, item.module)}
                        className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-left hover:bg-slate-50 transition-colors group"
                      >
                        <div className="truncate pr-4">
                          <div className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {item.subInfo}
                          </div>
                        </div>
                        <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE SEARCH BUTTON */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileSearchOpen(true)}
          className="text-slate-600 hover:text-blue-600 rounded-xl"
        >
          <Search className="w-5 h-5" />
        </Button>

        {/* Mobile Full Screen Overlay */}
        {isMobileSearchOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] p-4 flex flex-col">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] w-full">
              <div className="flex items-center px-4 py-3 border-b border-slate-100">
                <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search Applicants, Staff, Companies..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsMobileSearchOpen(false);
                    clearSearch();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isSearching ? (
                  <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    Searching...
                  </div>
                ) : searchQuery.length < 2 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Type 2 or more characters to search
                  </div>
                ) : Object.keys(groupedResults).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No results found
                  </div>
                ) : (
                  Object.entries(groupedResults).map(([moduleName, items]) => (
                    <div key={moduleName} className="space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                        {moduleName}
                      </div>
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleResultClick(item.link, item.name, item.module)}
                          className="flex items-center justify-between w-full p-3 rounded-xl border border-slate-100 text-left hover:bg-slate-50 hover:border-blue-200 transition-all"
                        >
                          <div className="truncate pr-4">
                            <div className="text-xs font-semibold text-slate-700 truncate">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {item.subInfo}
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
