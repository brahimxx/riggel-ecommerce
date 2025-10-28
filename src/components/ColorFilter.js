// src/components/filters/ColorFilter.js
"use client";
import React from "react";

const ColorFilter = ({ colors, selectedColors, onColorToggle }) => {
  return (
    <div className="font-sans">
      <div className="text-gray-800 mb-3 text-lg font-semibold">Colors</div>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          // Check if the current color is in the array of selected colors
          const isSelected = selectedColors.includes(color);

          return (
            <div key={color} className="relative">
              <button
                onClick={() => onColorToggle(color)}
                aria-label={`Filter by color ${color}`}
                className="w-8 h-8 rounded-full cursor-pointer transition-all"
                style={{
                  backgroundColor: color,
                  // Apply a visual indicator for selection
                  border: isSelected ? "2px solid white" : "1px solid #E5E7EB",
                  boxShadow: isSelected
                    ? `0 0 0 2px ${color}`
                    : "0 0 0 1px transparent",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ColorFilter;
