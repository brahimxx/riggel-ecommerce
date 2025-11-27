"use client";
import { Rate, message } from "antd";
import { useEffect, useState } from "react";
import QuantityCartBar from "@/components/QuantityCartBar";
import ProductGallery from "@/components/ProductGallery";
import ProductAttributes from "@/components/ProductAttributes";
import { useCartContext } from "@/components/CartContext";
import FavoriteButton from "@/components/FavoriteButton";

const ProductShowcase = ({ product }) => {
  const [attributes, setAttributes] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  // Build attribute options from variants (unchanged)
  useEffect(() => {
    const extractedAttributes = {};

    product.variants?.forEach((variant) => {
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

  // Called only when user changes variant in ProductAttributes
  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    // Do NOT touch selectedImageIndex here
  };

  // React to variant *id* change and jump once to its image
  useEffect(() => {
    if (!selectedVariant?.variant_id || !Array.isArray(product.images)) return;

    let idx = product.images.findIndex(
      (img) => img.variant_id === selectedVariant.variant_id
    );

    if (idx === -1) {
      idx = product.images.findIndex((img) => img.is_primary);
    }
    if (idx === -1) idx = 0;

    if (idx >= 0) {
      setSelectedImageIndex(idx);
    }
    // Depend only on primitive id + images, so it fires only when variant changes
  }, [selectedVariant?.variant_id, product.images]);

  const handleAddToCart = () => {
    if (!selectedVariant || !selectedVariant.variant_id) {
      message.error("Please select a valid product variant.");
      return;
    }
    addToCart(product, selectedVariant, quantity);
    message.success("Product added to cart!");
  };

  return (
    <div className="flex-col lg:flex lg:flex-row ">
      <div className="relative lg:w-[50%] h-[450px] min-[400px]:h-[500px] min-[500px]:h-[600px] min-[610px]:h-[750px] md:h-[530px] overflow-hidden">
        <ProductGallery
          images={product.images}
          selectedIndex={selectedImageIndex}
          onSelect={setSelectedImageIndex}
        />
      </div>

      {/* right side unchanged, just pass handleVariantSelect instead of directly setting image */}
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
          setSelectedVariant={handleVariantSelect}
        />

        <div className="flex gap-4 pt-[10px] border-gray-200/60">
          <QuantityCartBar quantity={quantity} setQuantity={setQuantity} />
          {Number(product.total_variants_quantities) === 0 ? (
            <button
              disabled
              className="bg-gray-200 text-gray-500 rounded-full py-2 text-lg font-medium transition min-w-[180px] cursor-not-allowed lg:min-w-0 w-full"
              aria-label="Out of Stock"
            >
              Out of Stock
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="bg-black hover:bg-black/90 text-white rounded-full py-2 text-lg font-medium transition min-w-[180px] cursor-pointer lg:min-w-0 w-full"
              aria-label="Add to Cart"
            >
              Add to Cart
            </button>
          )}
          <FavoriteButton product={product} className="text-3xl" />
        </div>
      </div>
    </div>
  );
};

export default ProductShowcase;
