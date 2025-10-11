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
      <div className="flex">
        <div className="flex w-[50%]">
          <div className="relative w-full  h-[530px] overflow-hidden">
            <ProductGallery images={product.images} />
          </div>
        </div>
        <div className="flex flex-col max-w-[50%] justify-between gap-[14px] pl-10 max-h-[530px]">
          <h2 className="font-integral leading-none text-[32px] lg:text-[40px]  font-extrabold">
            {product.name}
          </h2>
          <div className="flex relative ">
            <Rate
              disabled
              allowHalf
              defaultValue={Number(parseFloat(product.rating).toFixed(1)) || 0}
            />
            <span className="text-gray-500 ml-2 text-sm">
              {Number(parseFloat(product.rating).toFixed(1)) || 0}/5
            </span>
          </div>
          <p className="text-[32px] text-gray-900 font-semibold">
            ${displayPrice}
          </p>
          <p className="text-4 text-gray-700 line-clamp-3">
            {product.description}
          </p>

          <ProductAttributes
            attributes={attributes}
            variants={product.variants}
            setSelectedVariant={setSelectedVariant}
          />
          {/* <div className="py-[10px] border-t-[2px] border-gray-200/60">
            <ColorSelector />
          </div>

          <div className="py-[10px] border-y-[2px] border-gray-200/60">
            <SizeSelector />
          </div> */}
          <div className="pt-[10px] border-gray-200/60">
            <QuantityCartBar />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductShowcase;
