import Image from "next/image";
import QuantityCartBarSmall from "@/components/QuantityCartBarSmall";
import { DeleteOutlined } from "@ant-design/icons";
import Link from "next/link";
import { getSalePrice } from "@/lib/api";
import { Popconfirm } from "antd";

const CartProductCard = ({
  product,
  onUpdateQuantity,
  onRemove,
  maxStock = 999,
  stockError,
}) => {
  console.log("CartProductCard render:", product);
  const basePrice = product.price;
  const saleInfo = product.sale;
  const salePrice = getSalePrice({ sale: saleInfo }, basePrice);
  const available = maxStock;

  // Helper to check availability
  const isOutOfStock = Number(product.variant?.quantity) === 0;

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity <= available && newQuantity >= 1) {
      onUpdateQuantity(product.productId, product.variantId, newQuantity);
    }
  };

  const handleRemove = () => {
    onRemove(product.productId, product.variantId);
  };

  return (
    <div className="py-8">
      {/* Warning banner if quantity exceeds stock */}
      {stockError && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mb-2 text-sm">
          ⚠️ {stockError}{" "}
          <button
            onClick={() => handleQuantityChange(available)}
            className="underline font-medium ml-2 cursor-pointer"
          >
            Adjust to available
          </button>
        </div>
      )}

      <div className="flex h-[100px] sm:h-[115px] gap-3">
        <Link href={"/products/" + product.slug}>
          <Image
            src={product.image}
            alt={product.name}
            width={130}
            height={125}
            quality={100}
            className={`object-contain w-[130px] h-[115px] rounded-xl bg-[#F0EEED] ${
              isOutOfStock ? "opacity-50 grayscale" : ""
            }`}
          />
        </Link>

        <div className="flex w-full">
          <div className="flex flex-col w-full justify-between">
            <div className="flex justify-between flex-col md:flex-row">
              <div className="flex flex-col justify-between md:w-[50%]">
                <div className="flex items-center justify-between md:justify-start text-[12px] md:text-[16px] text-nowrap font-bold">
                  <Link
                    href={"/products/" + product.slug}
                    className={isOutOfStock ? "!text-gray-400" : "!text-black"}
                  >
                    {product.name}
                  </Link>

                  {!isOutOfStock &&
                  saleInfo &&
                  salePrice !== basePrice.toString() ? (
                    <span className="hidden md:block ml-2 bg-[#669900] text-white text-xs px-2 py-1 rounded">
                      {saleInfo?.name || ""}
                    </span>
                  ) : (
                    <span className="font-bold"></span>
                  )}

                  <Popconfirm
                    title="Remove this item from cart?"
                    onConfirm={handleRemove}
                    okText="Yes"
                    cancelText="No"
                  >
                    <div className="md:hidden inline self-center font-semibold text-red-500/90 rounded-full text-sm py-[6px] text-center cursor-pointer">
                      <DeleteOutlined />
                    </div>
                  </Popconfirm>
                </div>

                <div className="flex md:flex-col gap-2">
                  {product.attributes && product.attributes.length > 0 ? (
                    product.attributes.map((attr, index) => (
                      <p
                        key={index}
                        className={`text-[12px] md:text-[14px] ${
                          isOutOfStock ? "text-gray-300" : "text-gray-800/70"
                        }`}
                      >
                        {attr.name}: {attr.value}
                      </p>
                    ))
                  ) : (
                    <p></p>
                  )}
                </div>
              </div>

              <div className="hidden md:block text-[12px] md:text-[14px] md:pr-5 text-right items-center">
                {isOutOfStock ? (
                  <span className="font-bold text-red-500 text-center">
                    Out of stock
                  </span>
                ) : (
                  <>
                    {saleInfo && salePrice !== basePrice.toString() ? (
                      <>
                        <span className="line-through mr-2 text-gray-400 bh">
                          ${Number(basePrice).toFixed(2)}
                        </span>
                        <span className="font-bold text-[#669900]">
                          ${salePrice}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold">
                        ${Number(basePrice).toFixed(2)}
                      </span>
                    )}
                    <p className="text-gray-800/70">
                      ${(Number(salePrice) * product.quantity).toFixed(2)} total
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex md:flex-row text-[12px] justify-between items-start md:items-center">
              {isOutOfStock ? (
                <p className="text-[12px] text-gray-500">
                  This item is currently unavailable.
                </p>
              ) : (
                <>
                  <QuantityCartBarSmall
                    quantity={product.quantity}
                    onChange={handleQuantityChange}
                    maxQuantity={available}
                  />
                  {/* Show ONLY when at max stock */}
                  {product.quantity >= available && available < 999 && (
                    <span className="hidden md:block text-yellow-600 font-medium bg-yellow-100 p-2 rounded-full text-xs ml-1">
                      Max reached
                    </span>
                  )}
                </>
              )}

              <div className="md:hidden text-[12px] md:text-[14px] md:pr-5 text-right">
                {isOutOfStock ? (
                  <span className="font-bold text-red-500">Out of stock</span>
                ) : (
                  <>
                    {saleInfo && salePrice !== basePrice.toString() ? (
                      <>
                        <span className="line-through mr-2 text-gray-400 bh">
                          ${Number(basePrice).toFixed(2)}
                        </span>
                        <span className="font-bold text-[#669900]">
                          ${salePrice}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold">
                        ${Number(basePrice).toFixed(2)}
                      </span>
                    )}
                    <p className="text-gray-800/70">
                      ${(Number(salePrice) * product.quantity).toFixed(2)} total
                    </p>
                  </>
                )}
                {product.quantity >= available && available < 999 && (
                  <span className="md:hidden text-yellow-600 font-medium bg-yellow-100 -mx-2 p-2 py-0.5 rounded-full text-xs ml-1">
                    Max reached
                  </span>
                )}
              </div>

              <Popconfirm
                title="Remove this item from cart?"
                onConfirm={handleRemove}
                okText="Yes"
                cancelText="No"
              >
                <div className="hidden md:block self-center font-semibold text-red-500/90 hover:bg-red-100/80 cursor-pointer w-full md:w-[110px] rounded-full text-sm py-[6px] text-center">
                  <DeleteOutlined /> Remove
                </div>
              </Popconfirm>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartProductCard;
