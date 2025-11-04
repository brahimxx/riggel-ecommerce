import Image from "next/image";
import { Rate } from "antd";
import Link from "next/link";

const ProductCard = ({ product }) => {
  // Extract unique colors from variants
  const colors = [
    ...new Set(
      product.variants
        ?.map((variant) => {
          const colorAttr = variant.attributes?.find(
            (attr) => attr.name === "Color"
          );
          return colorAttr?.value;
        })
        .filter(Boolean)
    ),
  ];

  // Map color names to hex values
  const colorMap = {
    Brown: "#8B4513",
    Blue: "#4169E1",
    Black: "#000000",
    White: "#FFFFFF",
    Red: "#DC143C",
    Green: "#228B22",
    Yellow: "#FFD700",
    Pink: "#FF69B4",
    Purple: "#800080",
    Orange: "#FF8C00",
    Gray: "#808080",
    Grey: "#808080",
    Navy: "#000080",
    Beige: "#F5F5DC",
  };

  // Check if color is available (has stock)
  const isAvailable = (color) => {
    return product.variants?.some((variant) => {
      const colorAttr = variant.attributes?.find(
        (attr) => attr.name === "Color"
      );
      return colorAttr?.value === color && variant.quantity > 0;
    });
  };

  const getColorHex = (colorName) => {
    return colorMap[colorName] || colorName.toLowerCase();
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col w-[95%] lg:w-[280px] rounded-3xl xl:h-[440px] gap-4 overflow-hidden hover:shadow-[0_0_5px_rgba(0,0,0,0.1)] border border-gray-300/60 "
    >
      <div className="relative w-full h-[270px] xl:w-full xl:h-[300px] rounded-3xl xl:rounded-t-3xl xl:rounded-b-none overflow-hidden bg-[#F0EEED]">
        <Image
          src={product.main_image || "/images/products_images/product_test.png"}
          alt="product image"
          quality={100}
          fill
          className="object-fit transition-transform duration-300 ease-in-out group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col justify-between px-4 gap-3 pb-4">
        <p className="text-[16px] lg:text-[18px] font-bold lg:pt-0">
          {product.name}
        </p>
        <div className="flex flex-row items-center gap-2">
          <div className="relative">
            <Rate
              disabled
              allowHalf
              defaultValue={Number(parseFloat(product.rating).toFixed(1)) || 0}
            />
          </div>
          <p className="text-sm text-gray-500">
            {Number(parseFloat(product.rating).toFixed(1)) || 0}/5
          </p>
        </div>

        {/* Color Variants - Display Only */}
        {colors.length > 0 && (
          <div className="flex flex-row items-center gap-2">
            {colors.map((color) => {
              const available = isAvailable(color);
              const colorHex = getColorHex(color);

              return (
                <div key={color} className="relative">
                  <div
                    aria-label={`Color ${color}`}
                    className={`w-6 h-6 rounded-full transition-all ${
                      available ? "" : "opacity-40"
                    }`}
                    style={{
                      backgroundColor: colorHex,
                      border: "1px solid rgba(0,0,0,0.1)",
                    }}
                  />
                  {!available && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg
                        className="w-full h-full text-white"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <line
                          x1="0"
                          y1="100"
                          x2="100"
                          y2="0"
                          stroke="currentColor"
                          strokeWidth="5"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[20px] lg:text-[20px] font-bold">${product.price}</p>
      </div>
    </Link>
  );
};

export default ProductCard;
