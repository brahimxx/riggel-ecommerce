"use client";
import React, { useState } from "react";

const colors = ["#5C5032", "#385C53", "#2C304B"];

const ColorSelector = () => {
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  return (
    <div className="font-sans">
      <div className="text-gray-500 mb-3 text-lg font-medium">
        Select Colors
      </div>
      <div className="flex gap-5">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            aria-label={`Select color ${color}`}
            className={`w-10 h-10 rounded-full cursor-pointer p-0 outline-none relative`}
            style={{
              backgroundColor: color,
              border: selectedColor === color ? "3px solid white" : "none",
              boxShadow:
                selectedColor === color ? `0 0 0 3px ${color}` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorSelector;
