"use client";
import React from "react";

const QuantityCartBar = ({ quantity = 1, setQuantity, maxQuantity = 999 }) => {
  const handleDecrement = () => setQuantity((q) => Math.max(1, q - 1));

  const handleIncrement = () => {
    if (quantity >= maxQuantity) return; // Respect stock limit
    setQuantity((q) => q + 1);
  };

  const isMaxReached = quantity >= maxQuantity;

  return (
    <div className="flex text-[14px] lg:text-2xl items-center gap-4 font-sans">
      <div className="flex items-center bg-gray-200 rounded-full py-2 min-w-[90px] lg:min-w-[170px] justify-around">
        <button
          onClick={handleDecrement}
          className="text-black font-semibold lg:px-2 focus:outline-none cursor-pointer w-[33%]"
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
        >
          -
        </button>

        <span className="text-lg text-gray-800 select-none w-1/3 text-center">
          {quantity}
        </span>

        <button
          onClick={handleIncrement}
          className={`font-semibold lg:px-2 focus:outline-none w-[33%] transition-all ${
            isMaxReached
              ? "text-gray-400 cursor-not-allowed opacity-50"
              : "text-black cursor-pointer hover:text-black/80"
          }`}
          disabled={isMaxReached}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      {/* Show max stock warning ONLY when at limit */}
      {isMaxReached && maxQuantity < 999 && (
        <span className="text-xs whitespace-nowrap text-yellow-600 font-medium bg-yellow-100 p-2  rounded-full">
          Max available: {maxQuantity}
        </span>
      )}
    </div>
  );
};

export default QuantityCartBar;
