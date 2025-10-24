"use client";
import React from "react";

const QuantityCartBarSmall = ({ quantity = 1, onChange }) => {
  const handleDecrement = () => {
    const newQuantity = Math.max(1, quantity - 1);
    onChange?.(newQuantity);
  };

  const handleIncrement = () => {
    const newQuantity = quantity + 1;
    onChange?.(newQuantity);
  };

  return (
    <div className="flex items-center gap-4 text-sm lg:text-base font-sans">
      <div className="flex items-center bg-gray-200 rounded-full  py-1 min-w-[90px] lg:min-w-[110px] justify-around ">
        <button
          onClick={handleDecrement}
          className=" text-black font-semibold lg:px-2 focus:outline-none cursor-pointer w-[33%] "
          aria-label="Decrease quantity"
        >
          −
        </button>

        <span className="w-1/3 text-center text-gray-800 select-none">
          {quantity}
        </span>

        <button
          onClick={handleIncrement}
          className=" text-black font-semibold lg:px-2 focus:outline-none cursor-pointer w-[33%]"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default QuantityCartBarSmall;
