"use client";
import React, { useState } from "react";

const QuantityCartBar = () => {
  const [quantity, setQuantity] = useState(1);

  const handleDecrement = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrement = () => setQuantity((q) => q + 1);

  return (
    <div className="flex items-center gap-4 font-sans">
      <div className="flex items-center bg-gray-200 rounded-full px-6 py-2 min-w-[140px] justify-between">
        <button
          onClick={handleDecrement}
          className="text-2xl text-gray-500 font-light px-2 focus:outline-none"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="mx-2 text-lg text-gray-800 select-none">
          {quantity}
        </span>
        <button
          onClick={handleIncrement}
          className="text-2xl text-gray-500 font-light px-2 focus:outline-none"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button
        className="bg-black text-white rounded-full px-16 py-2 text-lg font-medium transition"
        aria-label="Add to Cart"
      >
        Add to Cart
      </button>
    </div>
  );
};

export default QuantityCartBar;
