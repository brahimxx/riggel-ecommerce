"use client";
import React from "react";
import { Select } from "antd";

const ShopHeader = ({
  currentPage,
  pageSize,
  totalProducts,
  sortBy,
  onSortByChange,
}) => {
  // Calculate the range of items being shown
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalProducts);

  // Don't render the header if there are no products
  if (totalProducts === 0) {
    return null;
  }

  return (
    <div className="flex justify-between items-center mb-8 text-sm text-gray-600">
      <p>
        Showing {startItem}-{endItem} of {totalProducts} Products
      </p>
      <div className="flex items-center gap-2">
        <span>Sort by:</span>
        <Select
          value={sortBy}
          onChange={onSortByChange}
          style={{ width: 160 }}
          variant="borderless"
        >
          <Select.Option value="created_at_desc">Newest</Select.Option>
          <Select.Option value="popularity_desc">
            Most Popular (Rating)
          </Select.Option>
          <Select.Option value="orders_desc">Best Selling</Select.Option>
          <Select.Option value="orders_asc">Least Selling</Select.Option>
          <Select.Option value="price_asc">Price: Low to High</Select.Option>
          <Select.Option value="price_desc">Price: High to Low</Select.Option>
        </Select>
      </div>
    </div>
  );
};

export default ShopHeader;
