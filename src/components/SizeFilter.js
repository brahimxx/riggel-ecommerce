// src/components/filters/SizeFilter.js
"use client";
import React from "react";

const SizeFilter = ({ allSizes, selectedSizes, onSizeToggle }) => {
  return (
    <div className="font-sans">
      <div className="text-gray-800 mb-3 text-lg font-semibold">Size</div>
      <div className="flex flex-wrap gap-3">
        {allSizes.map((size) => {
          const isSelected = selectedSizes.includes(size);
          // For a filter, we usually assume all sizes are available to select
          const isAvailable = true;

          return (
            <button
              key={size}
              onClick={() => onSizeToggle(size)}
              disabled={!isAvailable}
              className={`px-4 py-2 text-sm border rounded-full transition-colors ${
                isSelected
                  ? "bg-black text-white border-black"
                  : "border-gray-300 text-gray-700"
              } ${
                isAvailable
                  ? "cursor-pointer hover:border-black"
                  : "cursor-not-allowed bg-gray-100 text-gray-400"
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SizeFilter;
