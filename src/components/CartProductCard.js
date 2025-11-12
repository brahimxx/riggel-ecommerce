import Image from "next/image";
import QuantityCartBarSmall from "@/components/QuantityCartBarSmall";
import { DeleteOutlined } from "@ant-design/icons";
import Link from "next/link";

const CartProductCard = ({ product, onUpdateQuantity, onRemove }) => {
  const handleQuantityChange = (newQuantity) => {
    // Call the update function from the parent
    onUpdateQuantity(product.productId, product.variantId, newQuantity);
  };
  const handleRemove = () => {
    // Call the remove function from the parent
    onRemove(product.productId, product.variantId);
  };
  return (
    <div className="py-8  ">
      <div className="flex h-[115px] gap-3 ">
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
            <div className="flex justify-between">
              <div className="flex flex-col justify-between  w-[50%]">
                <Link
                  href={"/products/" + product.slug}
                  className="text-[16px] font-bold !text-black"
                >
                  {product.name}
                </Link>
                {product.attributes && product.attributes.length > 0 ? (
                  product.attributes.map((attr, index) => (
                    <p key={index} className="text-[14px] text-gray-800/70">
                      {attr.name}: {attr.value}
                    </p>
                  ))
                ) : (
                  <p></p>
                )}
              </div>

              <div className="flex flex-col ">
                <p className="pr-5 text-right text-[16px] font-bold">
                  ${product.price}
                </p>
                <div className="flex justify-between">
                  <p className="pr-5 text-right text-[14px] text-gray-800/70">
                    ${(product.price * product.quantity).toFixed(2)} total
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <QuantityCartBarSmall
                quantity={product.quantity}
                onChange={handleQuantityChange}
              />
              <div
                onClick={handleRemove}
                className="self-center font-semibold text-red-500/90 hover:bg-red-100/80 cursor-pointer w-full lg:w-[110px] rounded-full text-sm py-[6px] text-center"
              >
                <DeleteOutlined /> Remove
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartProductCard;
