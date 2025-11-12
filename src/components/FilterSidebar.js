"use client";
import React from "react";
import { SlidersOutlined } from "@ant-design/icons";
import { Slider, Checkbox } from "antd";
import ColorFilter from "@/components/ColorFilter";
import SizeFilter from "@/components/SizeFilter";

const FilterSidebar = ({
  // Price Filter Props
  priceRange,
  onPriceChange,
  // Category Filter Props
  categories,
  selectedCategory,
  onCategorySelect,
  // Color Filter Props
  colors,
  selectedColors,
  onColorToggle,
  // Size Filter Props
  sizes,
  selectedSizes,
  onSizeToggle,
  // Favorites Filter Props
  showFavoritesOnly,
  onFavoritesToggle,
}) => {
  const typeCategories = categories.filter(
    (cat) => cat.category_type === "type"
  );
  const styleCategories = categories.filter(
    (cat) => cat.category_type === "style"
  );

  return (
    <div className=" lg:border border-gray-300/60 rounded-2xl lg:px-6">
      {/* Header */}
      <div className="hidden lg:flex justify-between items-center border-b border-gray-300/60 py-6">
        <p className="font-semibold text-gray-800">Filter</p>
        <SlidersOutlined className="!text-gray-400 text-xl" />
      </div>

      {/* Favorites Filter Section */}
      <div className="border-b border-gray-300/60 py-6 flex items-center">
        <Checkbox checked={showFavoritesOnly} onChange={onFavoritesToggle}>
          Show Favorites Only
        </Checkbox>
      </div>

      {/* Price Filter Section */}
      <div className="border-b border-gray-300/60 py-6">
        <h3 className="font-semibold text-gray-800 mb-2">Price</h3>
        <Slider
          range
          min={0}
          max={500}
          value={priceRange}
          onChange={onPriceChange}
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>

      {/* Product Type Filter Section */}
      <ul className="flex flex-col gap-4 border-b border-gray-300/60 py-6">
        <h3 className="font-semibold text-gray-800 mb-2">Product Type</h3>
        {typeCategories.map((category) => (
          <li
            key={category.category_id}
            className="flex justify-between items-center hover:text-gray-900 text-gray-600"
          >
            <Checkbox
              className="cursor-pointer"
              onChange={() => onCategorySelect(category)}
              checked={selectedCategory?.category_id === category.category_id}
            >
              {category.name}
            </Checkbox>
          </li>
        ))}
      </ul>

      {/* Style Filter Section */}
      <ul className="flex flex-col gap-4 border-b border-gray-300/60 py-6">
        <h3 className="font-semibold text-gray-800 mb-2">Style / Occasion</h3>
        {styleCategories.map((category) => (
          <li
            key={category.category_id}
            className="flex justify-between items-center hover:text-gray-900 text-gray-600"
          >
            <Checkbox
              className="cursor-pointer"
              onChange={() => onCategorySelect(category)}
              checked={selectedCategory?.category_id === category.category_id}
            >
              {category.name}
            </Checkbox>
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
