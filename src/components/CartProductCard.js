import Image from "next/image";
import QuantityCartBarSmall from "@/components/QuantityCartBarSmall";
import { DeleteOutlined } from "@ant-design/icons";

const CartProductCard = () => {
  return (
    <div className="py-8 border-b-1 border-gray-300/60">
      <div className="flex h-[112px] gap-3  ">
        <Image
          src="/images/products_images/27_20251002170505.PNG"
          alt=""
          width={112}
          height={112}
          quality={100}
          className=" rounded-xl"
        />
        <div className="flex w-full">
          <div className="flex flex-col w-full justify-between">
            <div>
              <div className="flex justify-between text-[16px] font-bold w-full">
                <p className="">Monstera Deliciosa Study</p>
                <p className="pr-5 text-right">$85.00</p>
              </div>
              <div className="flex flex-col text-[14px] text-gray-800/70">
                <div className="flex justify-between">
                  <p>by Elena Botanical</p>
                  <p className="pr-5 text-right">$150.00 total</p>
                </div>

                <p>8" x 10" Watercolor on Paper</p>
              </div>
            </div>

            <div className="flex justify-between">
              <QuantityCartBarSmall />
              <div className="self-center font-semibold text-red-600  hover:bg-red-100/80 cursor-pointer w-full lg:w-[110px]  rounded-full text-sm py-[6px] text-center">
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
