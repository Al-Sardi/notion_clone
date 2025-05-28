"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const SearchButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when search is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen && 
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Handle search logic here
      console.log("Searching for:", searchQuery);
      // You can add your search logic here or pass the searchQuery up to a parent component
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "group flex items-center gap-x-2 py-2 px-3 w-full hover:bg-primary/5 rounded-md transition-colors"
        )}
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Search
        </span>
      </button>
    );
  }

  return (
    <form 
      onSubmit={handleSearch}
      className="relative w-full"
    >
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search documents..."
        className={cn(
          "w-full bg-transparent pl-10 pr-8 py-2 text-sm rounded-md border border-input",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
      />
      <button
        type="button"
        onClick={() => {
          setSearchQuery("");
          setIsOpen(false);
        }}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </form>
  );
};
