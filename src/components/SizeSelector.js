"use client";
import React, { useState } from "react";

const sizes = ["Small", "Medium", "Large", "X-Large"];

const SizeSelector = () => {
  const [selected, setSelected] = useState("Large");

  return (
    <div className="font-sans">
      <div className="text-gray-500 mb-3 text-base font-medium">
        Choose Size
      </div>
      <div className="flex gap-4">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => setSelected(size)}
            className={`px-6 py-2 rounded-full  transition cursor-pointer
              ${
                selected === size
                  ? "bg-black text-white"
                  : "bg-[#F0F0F0] text-gray-400"
              }`}
            style={{
              fontSize: "18px",
            }}
            aria-label={`Select size ${size}`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SizeSelector;
