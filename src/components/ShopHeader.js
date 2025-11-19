"use client";
import React from "react";
import { Select } from "antd";
import { SlidersOutlined } from "@ant-design/icons";

const ShopHeader = ({
  currentPage,
  pageSize,
  totalProducts,
  sortBy,
  onSortByChange,
  setShowFilter,
  showFilter,
}) => {
  // Calculate the range of items being shown
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalProducts);

  return (
    <div className="flex justify-between items-center mb-8 text-[14px] lg:text-sm text-gray-600">
      {/* Only hide the product count on desktop when there are no products */}
      <p className="hidden lg:block">
        {totalProducts > 0
          ? `Showing ${startItem}-${endItem} of ${totalProducts} Products`
          : "Showing 0 of 0 Products"}
      </p>

      <div className="flex items-center  gap-2 justify-between w-full lg:w-auto">
        <div>
          <span>Sort by:</span>
          <Select
            value={sortBy}
            onChange={onSortByChange}
            variant="borderless"
            className="lg:w-[150px]"
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

        <div
          className="cursor-pointer lg:hidden rounded-full bg-[#F0EEED] w-8 h-8 sm:w-12 sm:h-12 flex justify-center items-center"
          onClick={() => setShowFilter(!showFilter)}
        >
          <SlidersOutlined className="sm:text-lg" />
        </div>
      </div>
    </div>
  );
};

export default ShopHeader;
