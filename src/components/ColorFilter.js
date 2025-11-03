// src/components/filters/ColorFilter.js
"use client";
import React from "react";

const colorMap = {
  Brown: "#8B4513",
  Blue: "#4169E1",
  Black: "#000000",
  White: "#FFFFFF",
  Red: "#DC143C",
  Green: "#228B22",
  Yellow: "#FFD700",
  Pink: "#FF69B4",
  Purple: "#800080",
  Orange: "#FF8C00",
  Gray: "#808080",
  Grey: "#808080",
  Navy: "#000080",
  Beige: "#F5F5DC",
};

const ColorFilter = ({ colors, selectedColors, onColorToggle }) => {
  const getColorHex = (colorName) => {
    return colorMap[colorName] || colorName.toLowerCase();
  };

  return (
    <div className="font-sans">
      <div className="text-gray-800 mb-3 text-lg font-semibold">Colors</div>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          // Check if the current color is in the array of selected colors
          const isSelected = selectedColors.includes(color);
          const colorHex = getColorHex(color);

          return (
            <div key={color} className="relative">
              <button
                onClick={() => onColorToggle(color)}
                aria-label={`Filter by color ${color}`}
                className="w-8 h-8 rounded-full cursor-pointer transition-all"
                style={{
                  backgroundColor: colorHex,
                  // Apply a visual indicator for selection
                  border: isSelected ? "2px solid white" : "1px solid #E5E7EB",
                  boxShadow: isSelected
                    ? `0 0 0 2px ${colorHex}`
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
