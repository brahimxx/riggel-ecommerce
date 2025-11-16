"use client";
import { Rate } from "antd";
import { useEffect, useState } from "react";
import QuantityCartBar from "@/components/QuantityCartBar";
import ProductGallery from "@/components/ProductGallery";
import ProductAttributes from "@/components/ProductAttributes";
import { useCartContext } from "@/components/CartContext";
import { message } from "antd";
import FavoriteButton from "@/components/FavoriteButton";

const ProductShowcase = ({ product }) => {
  const [attributes, setAttributes] = useState({});
  const [selectedVariant, setSelectedVariant] = useState({});
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useCartContext();
  const basePrice = selectedVariant?.price || product.price;
  const sale = product.sale;

  function getSalePrice(basePrice, sale) {
    if (!sale) return null;
    if (sale.discount_type === "percentage") {
      return (basePrice * (1 - sale.discount_value / 100)).toFixed(2);
    }
    if (sale.discount_type === "fixed") {
      return (basePrice - sale.discount_value).toFixed(2);
    }
    return null;
  }

  const salePrice = getSalePrice(basePrice, sale);

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

  const handleAddToCart = () => {
    if (!selectedVariant) {
      message.error("Please select a valid product variant.");
      return;
    } else {
      addToCart(product, selectedVariant, quantity);
      message.success("Product added to cart!");
    }
  };

  console.log(product);
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
          {salePrice ? (
            <div className="flex justify-between items-center">
              <div>
                <span className="line-through text-gray-800/70 mr-2">
                  ${Number(basePrice).toFixed(2)}
                </span>
                <span className="text-[#669900] text-[24px] lg:text-[40px] font-extrabold">
                  ${salePrice}
                </span>
              </div>

              <span className="ml-2 bg-[#669900] text-white text-xs px-2 py-1 rounded">
                On sale{sale?.name ? `: ${sale.name}` : ""}
              </span>
            </div>
          ) : (
            <span className="text-[24px] lg:text-[40px] text-gray-900 font-extrabold lg:font-bold">
              ${Number(basePrice).toFixed(2)}
            </span>
          )}

          <p className="text-[14px] lg:text-4 text-gray-700 line-clamp-2">
            {product.description}
          </p>

          <ProductAttributes
            attributes={attributes}
            variants={product.variants}
            setSelectedVariant={setSelectedVariant}
          />
          <div className="flex gap-4 pt-[10px] border-gray-200/60">
            <QuantityCartBar quantity={quantity} setQuantity={setQuantity} />
            <button
              onClick={handleAddToCart}
              className="bg-black hover:bg-black/90 text-white rounded-full  py-2 text-lg font-medium transition min-w-[180px] cursor-pointer lg:min-w-0 w-full"
              aria-label="Add to Cart"
            >
              Add to Cart
            </button>
            <FavoriteButton product={product} className="text-3xl" />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductShowcase;
