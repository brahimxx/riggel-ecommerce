import Image from "next/image";
import QuantityCartBarSmall from "@/components/QuantityCartBarSmall";
import { DeleteOutlined } from "@ant-design/icons";
import Link from "next/link";
import { getSalePrice } from "@/lib/api";
import { Popconfirm } from "antd";

const CartProductCard = ({ product, onUpdateQuantity, onRemove }) => {
  const basePrice = product.price;
  const saleInfo = product.sale;
  const salePrice = getSalePrice({ sale: saleInfo }, basePrice);
  const handleQuantityChange = (newQuantity) => {
    // Call the update function from the parent
    onUpdateQuantity(product.productId, product.variantId, newQuantity);
  };
  const handleRemove = () => {
    // Call the remove function from the parent
    onRemove(product.productId, product.variantId);
  };
  return (
    <div className="py-8">
      <div className="flex h-[100px] sm:h-[115px] gap-3 ">
        <Link href={"/products/" + product.slug}>
          <Image
            src={product.image}
            alt={product.name}
            width={130}
            height={125}
            quality={100}
            className="w-[130px] h-[115px] rounded-xl "
          />
        </Link>

        <div className="flex w-full">
          <div className="flex flex-col w-full justify-between">
            <div className="flex justify-between flex-col md:flex-row">
              <div className="flex flex-col justify-between  md:w-[50%]">
                <div
                  href={"/products/" + product.slug}
                  className="flex items-center justify-between text-[12px] md:text-[16px] text-nowrap font-bold "
                >
                  <Link
                    href={"/products/" + product.slug}
                    className="!text-black"
                  >
                    {product.name}
                  </Link>
                  {saleInfo && salePrice !== basePrice.toString() ? (
                    <>
                      <span className="hidden md:block ml-2 bg-[#669900] text-white text-xs px-2 py-1 rounded">
                        {saleInfo?.name ? `${saleInfo.name}` : ""}
                      </span>
                    </>
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
                        className="text-[12px] md:text-[14px] text-gray-800/70"
                      >
                        {attr.name}: {attr.value}
                      </p>
                    ))
                  ) : (
                    <p></p>
                  )}
                </div>
              </div>

              <div className="hidden md:block text-[12px] md:text-[14px] md:pr-5 text-right">
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
                <p className=" text-gray-800/70 ">
                  ${(Number(salePrice) * product.quantity).toFixed(2)} total
                </p>
              </div>
            </div>

            <div className="flex text-[12px] justify-between items-start md:items-center">
              <QuantityCartBarSmall
                quantity={product.quantity}
                onChange={handleQuantityChange}
              />
              <div className="md:hidden text-[12px] md:text-[14px] md:pr-5 text-right">
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
                <p className=" text-gray-800/70 ">
                  ${(Number(salePrice) * product.quantity).toFixed(2)} total
                </p>
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
