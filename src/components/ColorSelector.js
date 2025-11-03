// src/components/ColorSelector.js
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

const ColorSelector = ({
  colors,
  selectedColor,
  onColorSelect,
  isAvailable,
}) => {
  const getColorHex = (colorName) => {
    return colorMap[colorName] || colorName.toLowerCase();
  };

  return (
    <div className="font-sans">
      <div className="text-gray-500 mb-3 text-[14px] lg:text-lg font-medium">
        Select Colors
      </div>
      <div className="flex gap-5">
        {colors.map((color) => {
          const isSelected = selectedColor === color;
          const available = isAvailable(color);
          const colorHex = getColorHex(color);

          return (
            <div key={color} className="relative">
              <button
                onClick={() => available && onColorSelect(color)}
                disabled={!available}
                aria-label={`Select color ${color}`}
                className={`w-10 h-10 rounded-full p-0 outline-none transition-all ${
                  available ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                }`}
                style={{
                  backgroundColor: colorHex,
                  border: isSelected ? "3px solid white" : "none",
                  boxShadow: isSelected ? `0 0 0 3px ${colorHex}` : "none",
                }}
              />
              {!available && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg
                    className="w-full h-full text-white"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <line
                      x1="0"
                      y1="100"
                      x2="100"
                      y2="0"
                      stroke="currentColor"
                      strokeWidth="5"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ColorSelector;
