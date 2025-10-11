// src/components/ColorSelector.js
"use client";
import React from "react";

const ColorSelector = ({
  colors,
  selectedColor,
  onColorSelect,
  isAvailable,
}) => {
  return (
    <div className="font-sans">
      <div className="text-gray-500 mb-3 text-lg font-medium">
        Select Colors
      </div>
      <div className="flex gap-5">
        {colors.map((color) => {
          const isSelected = selectedColor === color;
          const available = isAvailable(color);

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
                  backgroundColor: color,
                  border: isSelected ? "3px solid white" : "none",
                  boxShadow: isSelected ? `0 0 0 3px ${color}` : "none",
                }}
              />
              {!available && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg
                    className="w-full h-full text-white" // Set the bar color to white
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <line
                      x1="0"
                      y1="100"
                      x2="100"
                      y2="0"
                      stroke="currentColor"
                      strokeWidth="5" // Adjust thickness if needed
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
