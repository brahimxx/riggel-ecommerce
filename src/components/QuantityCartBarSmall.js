"use client";
import React from "react";

const QuantityCartBarSmall = ({
  quantity = 1,
  onChange,
  maxQuantity = 999,
}) => {
  const handleDecrement = () => {
    const newQuantity = Math.max(1, quantity - 1);
    onChange?.(newQuantity);
  };

  const handleIncrement = () => {
    if (quantity >= maxQuantity) return; // Respect max stock
    const newQuantity = quantity + 1;
    onChange?.(newQuantity);
  };

  const isMaxReached = quantity >= maxQuantity;

  return (
    <div className="flex items-center gap-4 text-[12px] md:text-base font-sans">
      <div className="flex items-center bg-gray-200 rounded-full py-1 min-w-[60px] md:min-w-[110px] justify-around">
        <button
          onClick={handleDecrement}
          className="text-black font-semibold lg:px-2 focus:outline-none cursor-pointer w-[33%]"
          aria-label="Decrease quantity"
          disabled={quantity <= 1}
        >
          −
        </button>

        <span className="w-1/3 text-center text-gray-800 select-none">
          {quantity}
        </span>

        <button
          onClick={handleIncrement}
          className={`font-semibold lg:px-2 focus:outline-none w-[33%] transition-all ${
            isMaxReached
              ? "text-gray-400 cursor-not-allowed opacity-50"
              : "text-black cursor-pointer hover:text-black/80"
          }`}
          aria-label="Increase quantity"
          disabled={isMaxReached}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default QuantityCartBarSmall;
