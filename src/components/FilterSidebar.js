"use client";
import { useState, useEffect } from "react";
import { SlidersOutlined, DeleteOutlined } from "@ant-design/icons"; // Added Delete icon
import { Slider, Checkbox, Button } from "antd"; // Added Button
import ColorFilter from "@/components/ColorFilter";
import SizeFilter from "@/components/SizeFilter";

const FilterSidebar = ({
  priceRange,
  onPriceChange,
  categories,
  selectedTypeCategories,
  selectedStyleCategories,
  handleTypeCategoryToggle,
  handleStyleCategoryToggle,
  colors,
  selectedColors,
  onColorToggle,
  sizes,
  selectedSizes,
  onSizeToggle,
  showFavoritesOnly,
  onFavoritesToggle,
  showOnSaleOnly,
  onOnSaleToggle,
  onClearFilters, // 1. New Prop: Function to reset all states in parent
}) => {
  const [localPrice, setLocalPrice] = useState(priceRange);

  const typeCategories = categories.filter(
    (cat) => cat.category_type === "type"
  );
  const styleCategories = categories.filter(
    (cat) => cat.category_type === "style"
  );

  useEffect(() => {
    setLocalPrice(priceRange);
  }, [priceRange[0], priceRange[1]]);

  // 2. Helper to check if any filter is active (to disable button if clean)
  const hasActiveFilters =
    selectedTypeCategories.length > 0 ||
    selectedStyleCategories.length > 0 ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    showFavoritesOnly ||
    showOnSaleOnly ||
    priceRange[0] > 0 || // Assuming 0 is min
    priceRange[1] < 500; // Assuming 500 is max

  return (
    <div className="lg:border border-gray-300/60 rounded-2xl lg:px-6">
      {/* Header */}
      <div className="hidden lg:flex justify-between items-center border-b border-gray-300/60 py-6">
        <div className="flex items-center gap-2">
          <SlidersOutlined className="!text-gray-400 text-xl" />
          <p className="font-semibold text-gray-800">Filter</p>
        </div>

        {/* 3. Clear Button */}
        <Button
          type="text"
          size="small"
          danger
          disabled={!hasActiveFilters}
          onClick={onClearFilters}
          className="text-xs font-medium hover:bg-red-50"
        >
          Clear All
        </Button>
      </div>

      <div className="lg:hidden flex justify-end pb-4">
        <Button
          type="link"
          danger
          disabled={!hasActiveFilters}
          onClick={(e) => {
            e.preventDefault(); // Prevent form submission or bubbling
            onClearFilters();
          }}
        >
          Reset Filters
        </Button>
      </div>

      {/* Favorites Filter Section */}
      <div className="border-b border-gray-300/60 py-6 flex items-center">
        <Checkbox
          checked={showFavoritesOnly}
          onChange={(e) => {
            e.stopPropagation();
            onFavoritesToggle(e);
          }}
        >
          Show Favorites Only
        </Checkbox>
      </div>

      {/* ... Rest of your component (On Sale, Price, etc.) ... */}

      {/* On Sale Filter Section */}
      <div className="border-b border-gray-300/60 py-6 flex items-center">
        <Checkbox
          checked={showOnSaleOnly}
          onChange={(e) => {
            e.stopPropagation();
            onOnSaleToggle(e);
          }}
        >
          Show On Sale Only
        </Checkbox>
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
          value={localPrice}
          onChange={(val) => setLocalPrice(val)}
          onChangeComplete={(val) => onPriceChange(val)}
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>${localPrice[0]}</span>
          <span>${localPrice[1]}</span>
        </div>
      </div>

      {/* ... The rest of your sections remain exactly the same ... */}

      {/* Product Type Filter Section */}
      <ul className="flex flex-col gap-4 border-b border-gray-300/60 py-6">
        <h3 className="font-semibold text-gray-800 mb-2">Product Type</h3>
        {typeCategories.map((category) => (
          <li key={category.category_id}>
            <Checkbox
              checked={selectedTypeCategories.some(
                (cat) => cat.category_id === category.category_id
              )}
              onChange={() => handleTypeCategoryToggle(category)}
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
          <li key={category.category_id}>
            <Checkbox
              checked={selectedStyleCategories.some(
                (cat) => cat.category_id === category.category_id
              )}
              onChange={() => handleStyleCategoryToggle(category)}
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
