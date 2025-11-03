"use client";

import React, { useState, useEffect } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

const SEARCH_DELAY = 800; // Delay before searching (ms)
const MIN_SEARCH_LENGTH = 2; // Minimum characters before auto-search

const SearchBar = () => {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const [term, setTerm] = useState(searchParams.get("query")?.toString() || "");

  // Update URL with search term
  const updateURL = (searchTerm) => {
    const params = new URLSearchParams(searchParams);

    // Only search if empty OR has minimum length
    if (searchTerm && searchTerm.trim().length < MIN_SEARCH_LENGTH) {
      return; // Don't update URL yet
    }

    if (searchTerm && searchTerm.trim()) {
      params.set("query", searchTerm.trim());
    } else {
      params.delete("query");
    }
    replace(`/shop?${params.toString()}`);
  };

  // Debounced version for onChange event
  const debouncedUpdateURL = useDebouncedCallback(updateURL, SEARCH_DELAY);

  // Sync local state if URL changes externally
  useEffect(() => {
    setTerm(searchParams.get("query")?.toString() || "");
  }, [searchParams]);

  // Handle form submission (Enter key)
  const handleSubmit = (e) => {
    e.preventDefault();

    // Allow immediate search on Enter, even with less than MIN_SEARCH_LENGTH
    const params = new URLSearchParams(searchParams);
    if (term && term.trim()) {
      params.set("query", term.trim());
    } else {
      params.delete("query");
    }
    replace(`/shop?${params.toString()}`);
  };

  // Handle input change
  const handleChange = (e) => {
    const value = e.target.value;
    setTerm(value);

    // If user clears the search, update immediately
    if (!value || value.trim() === "") {
      updateURL("");
    } else {
      // Otherwise, use debounced update
      debouncedUpdateURL(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative hidden md:block">
      <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
        <SearchOutlined className="text-gray-500" />
      </div>
      <input
        type="text"
        value={term}
        onChange={handleChange}
        className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-full bg-gray-50 focus:ring-black focus:border-black"
        placeholder="Search..."
      />
    </form>
  );
};

export default SearchBar;
