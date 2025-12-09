import React from "react";
import { Tabs } from "antd";
import "./productTabs.css";

const tabItems = (children) => [
  {
    label: "Details",
    key: "1",
    children: children[0] || <div>Product Details content</div>,
  },
  {
    label: "Rating & Reviews",
    key: "2",
    children: children[1] || <div>Rating & Reviews content</div>,
  },
  {
    label: "FAQs",
    key: "3",
    children: children[2] || <div>FAQs content</div>,
  },
];

const ProductTabs = ({ children = [] }) => (
  <div className="my-[36px] lg:my-15 ">
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
