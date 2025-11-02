"use client";

import React, { useState, useEffect } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

const SearchBar = () => {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const [term, setTerm] = useState(searchParams.get("query")?.toString() || "");

  // --- MODIFICATION: Create a reusable function to update the URL ---
  const updateURL = (searchTerm) => {
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set("query", searchTerm);
    } else {
      params.delete("query");
    }
    replace(`/shop?${params.toString()}`);
  };

  // Debounced version for the onChange event
  const debouncedUpdateURL = useDebouncedCallback(updateURL, 300);

  // Sync local state if the URL is changed by other means
  useEffect(() => {
    setTerm(searchParams.get("query")?.toString() || "");
  }, [searchParams]);

  // --- MODIFICATION: Handle form submission for 'Enter' key press ---
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent full page reload
    updateURL(term); // Trigger the search immediately
  };

  return (
    // MODIFICATION: Wrap the input in a form
    <form onSubmit={handleSubmit} className="relative hidden md:block">
      <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
        <SearchOutlined className="text-gray-500" />
      </div>
      <input
        type="text"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          debouncedUpdateURL(e.target.value);
        }}
        className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-full bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Search..."
      />
    </form>
  );
};

export default SearchBar;
