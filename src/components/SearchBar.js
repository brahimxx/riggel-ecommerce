"use client";

import React, { useState, useEffect, useRef } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

const SEARCH_DELAY = 800;
const MIN_SEARCH_LENGTH = 2;

const SearchBar = () => {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const [term, setTerm] = useState(searchParams.get("query")?.toString() || "");
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef(null);

  const updateURL = (searchTerm) => {
    const params = new URLSearchParams(searchParams);

    if (searchTerm && searchTerm.trim().length < MIN_SEARCH_LENGTH) {
      return;
    }

    if (searchTerm && searchTerm.trim()) {
      params.set("query", searchTerm.trim());
    } else {
      params.delete("query");
    }
    replace(`/shop?${params.toString()}`);
  };

  const debouncedUpdateURL = useDebouncedCallback(updateURL, SEARCH_DELAY);

  useEffect(() => {
    setTerm(searchParams.get("query")?.toString() || "");
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const params = new URLSearchParams(searchParams);
    if (term && term.trim()) {
      params.set("query", term.trim());
    } else {
      params.delete("query");
    }
    replace(`/shop?${params.toString()}`);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setTerm(value);

    if (!value || value.trim() === "") {
      updateURL("");
    } else {
      debouncedUpdateURL(value);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);

    if (!isExpanded) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 350);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isExpanded && !e.target.closest(".search-container")) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  return (
    <>
      <form onSubmit={handleSubmit} className="relative hidden md:block">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <SearchOutlined className="text-gray-500" />
        </div>
        <input
          type="text"
          value={term}
          onChange={handleChange}
          className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-full bg-gray-50 focus:!outline-black"
          placeholder="Search..."
        />
      </form>

      <div className="md:hidden search-container">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center justify-end"
        >
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={handleChange}
            style={{
              width: isExpanded ? "calc(100vw - 70px - 9px)" : "2.5rem",
            }}
            className={`
              absolute right-0 p-2 z-[21] pr-10 text-sm text-gray-900 
              border border-gray-300 rounded-full bg-gray-50 
              focus:!outline-black
              transition-all duration-300 ease-in-out
              ${isExpanded ? "opacity-100" : "opacity-0"}
            `}
            placeholder="Search..."
          />

          <button
            type="button"
            onClick={toggleExpand}
            className={`
              relative z-22 flex items-center justify-center
              w-10 h-10 rounded-full
              transition-all duration-300 ease-in-out
              ${
                isExpanded
                  ? "bg-transparent"
                  : "border-gray-300 hover:bg-gray-100"
              }
            `}
          >
            <SearchOutlined
              className={`transition-transform duration-300 text-xl ${
                isExpanded ? "scale-90" : "scale-100"
              }`}
            />
          </button>
        </form>
      </div>
    </>
  );
};

export default SearchBar;
