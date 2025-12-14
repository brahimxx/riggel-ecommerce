import React from "react";
import { Tabs } from "antd";
import "./productTabs.css";

const tabItems = (children) => [
  {
    label: "Details",
    key: "1",
    children: children[0] || (
      <div className="flex flex-col">
        {/* Section title to match Reviews */}
        <h2 className="text-[20px] lg:text-2xl font-bold my-[24px] lg:my-8">
          Product Details{" "}
          <span className="font-normal text-base lg:text-lg text-[#669900]">
            Essentials
          </span>
        </h2>

        {/* Card wrapper */}
        <div className="rounded-xl border border-[#6699001a] bg-white p-4 sm:p-5 lg:p-6 space-y-4 lg:space-y-5">
          {/* Badge row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold tracking-[0.14em] uppercase sm:text-sm text-[#669900]">
              Key features
            </p>
            <span className="inline-flex w-fit items-center rounded-full bg-[#66990014] px-3 py-1 text-[11px] font-medium text-[#669900]">
              Everyday essential
            </span>
          </div>

          {/* Short pitch */}
          <p className="text-sm leading-relaxed text-gray-700 sm:text-[15px] lg:text-base">
            Built for daily rotation with a clean look that works for casual
            days, weekends, and relaxed office outfits.
          </p>

          {/* Two-column feature list */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-5">
            <ul className="space-y-1.5 text-sm text-gray-800 sm:text-[15px]">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#669900]" />
                <span>Soft, breathable fabric for all‑day comfort.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#669900]" />
                <span>Regular fit that sits naturally on the body.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#669900]" />
                <span>Clean finish with reinforced seams.</span>
              </li>
            </ul>

            <ul className="space-y-1.5 text-sm text-gray-800 sm:text-[15px]">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#669900]" />
                <span>Easy to pair with jeans, chinos, or shorts.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#669900]" />
                <span>True to size – choose your usual size.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#669900]" />
                <span>Designed to stay in shape after repeated wear.</span>
              </li>
            </ul>
          </div>

          {/* Care hint */}
          <p className="text-xs sm:text-[11px] lg:text-xs text-[#669900cc]">
            For best results, wash inside out with similar colors and follow the
            care label instructions.
          </p>
        </div>
      </div>
    ),
  },
  {
    label: "Rating & Reviews",
    key: "2",
    children: children[1] || <div>Rating & Reviews content</div>,
  },
];

const ProductTabs = ({ children = [] }) => (
  <div className="mt-[36px] lg:mt-15">
    <Tabs
      defaultActiveKey="2"
      centered
      items={tabItems(children)}
      animated={{ inkBar: true, tabPane: false }}
      tabBarStyle={{
        fontSize: 18,
        marginBottom: 0,
        border: "none",
        background: "transparent",
      }}
      moreIcon={null}
      className="custom-product-tabs"
    />
  </div>
);

export default ProductTabs;
