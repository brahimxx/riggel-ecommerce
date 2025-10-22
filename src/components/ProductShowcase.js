"use client";
import { Rate } from "antd";
import { useEffect, useState } from "react";
import QuantityCartBar from "@/components/QuantityCartBar";
import ProductGallery from "@/components/ProductGallery";
import ProductAttributes from "@/components/ProductAttributes";

const ProductShowcase = ({ product }) => {
  const [attributes, setAttributes] = useState({});
  const [selectedVariant, setSelectedVariant] = useState({});

  useEffect(() => {
    const extractedAttributes = {};

    product.variants?.forEach((variant) => {
      // Ensure variant and attributes are valid
      if (
        typeof variant === "object" &&
        variant !== null &&
        Array.isArray(variant.attributes)
      ) {
        variant.attributes.forEach((attr) => {
          if (!extractedAttributes[attr.name]) {
            extractedAttributes[attr.name] = new Set();
          }
          extractedAttributes[attr.name].add(attr.value);
        });
      }
    });

    const finalAttributes = {};
    for (const key in extractedAttributes) {
      finalAttributes[key] = Array.from(extractedAttributes[key]);
    }

    setAttributes(finalAttributes);
  }, [product]);

  const displayPrice = selectedVariant?.price || product.price;

  return (
    <>
      <div className="flex-col lg:flex lg:flex-row ">
        <div className="relative lg:w-[50%] h-[408px] md:h-[530px] overflow-hidden">
          <ProductGallery images={product.images} />
        </div>
        <div className="flex flex-col lg:max-w-[50%] justify-around lg:justify-between gap-[12px] lg:gap-[14px] lg:pl-10 lg:max-h-[530px] mt-[36px] lg:mt-0">
          <h2 className="font-integral leading-none text-[24px] lg:text-[40px] font-extrabold">
            {product.name}
          </h2>
          <div className="flex relative ">
            <Rate
              disabled
              allowHalf
              defaultValue={Number(parseFloat(product.rating).toFixed(1)) || 0}
            />
            <span className="text-gray-500 ml-2 text-sm font-semibold">
              {Number(parseFloat(product.rating).toFixed(1)) || 0}/5
            </span>
          </div>
          <p className="text-[24px] lg:text-[40px] text-gray-900 font-extrabold lg:font-bold">
            ${displayPrice}
          </p>
          <p className="text-[14px] lg:text-4 text-gray-700 line-clamp-3">
            {product.description}
          </p>

          <ProductAttributes
            attributes={attributes}
            variants={product.variants}
            setSelectedVariant={setSelectedVariant}
          />
          <div className="flex gap-4 pt-[10px] border-gray-200/60">
            <QuantityCartBar />{" "}
            <button
              className="bg-black text-white rounded-full  py-2 text-lg font-medium transition min-w-[180px] cursor-pointer lg:min-w-0 w-full"
              aria-label="Add to Cart"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductShowcase;
