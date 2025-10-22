"use client";
import React, { useState } from "react";

const QuantityCartBarSmall = () => {
  const [quantity, setQuantity] = useState(1);

  const handleDecrement = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrement = () => setQuantity((q) => q + 1);

  return (
    <div className="flex text-[14px] lg:text-md items-center gap-4 font-sans ">
      <div className="flex items-center bg-gray-200 rounded-full  py-1 min-w-[90px] lg:min-w-[110px] justify-around ">
        <button
          onClick={handleDecrement}
          className=" text-black font-semibold lg:px-2 focus:outline-none cursor-pointer w-[33%] "
          aria-label="Decrease quantity"
        >
          -
        </button>
        <span className=" text-[14px] text-gray-800 select-none">
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
