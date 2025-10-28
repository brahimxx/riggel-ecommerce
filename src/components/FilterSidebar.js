// src/components/FilterSidebar.js
"use client";
import React from "react";
import { SlidersOutlined, RightOutlined } from "@ant-design/icons";
import { Slider } from "antd";
import ColorFilter from "@/components/ColorFilter";
import SizeFilter from "@/components/SizeFilter";

const FilterSidebar = ({
  // Props for Price Filter
  priceRange,
  onPriceChange,
  // Props for Category Filter
  categories,
  // Props for Color Filter
  colors,
  selectedColors,
  onColorToggle,
  // Props for Size Filter
  sizes,
  selectedSizes,
  onSizeToggle,
}) => {
  return (
    <div className="w-[20%] border border-gray-300/60 rounded-2xl px-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-300/60 py-6">
        <p className="font-semibold text-gray-800">Filter</p>
        <SlidersOutlined />
      </div>

      {/* Price Filter Section */}
      <div className="border-b border-gray-300/60 py-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-800">Price</h3>
        </div>
        <Slider
          range
          min={0}
          max={500}
          value={priceRange}
          onChange={onPriceChange}
          // Add your custom styles back here if needed
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>

      {/* Category Filter Section */}
      <ul className="flex flex-col gap-4 border-b border-gray-300/60 py-6">
        {categories.map((category) => (
          <li
            key={category}
            className="flex justify-between items-center cursor-pointer hover:text-gray-900 text-gray-600"
          >
            <p>{category}</p>
            <RightOutlined className="text-xs" />
          </li>
        ))}
      </ul>

      {/* Color Filter Section */}
      <div className="border-b border-gray-300/60 py-6">
        <ColorFilter
          colors={colors}
          selectedColors={selectedColors}
          onColorToggle={onColorToggle}
        />
      </div>

      {/* Size Filter Section */}
      <div className="py-6">
        <SizeFilter
          allSizes={sizes}
          selectedSizes={selectedSizes}
          onSizeToggle={onSizeToggle}
        />
      </div>
    </div>
  );
};

export default FilterSidebar;
