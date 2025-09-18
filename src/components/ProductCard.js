import Image from "next/image";
import { Rate } from "antd";

const ProductCard = ({ product }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="relative w-[295px] h-[295px] rounded-3xl overflow-hidden ">
        <Image
          src="/images/products_images/product_test.png"
          alt="product image"
          quality={100}
          fill
          className="object-contain "
        />
      </div>
      <p className="text-[20px] font-bold">T-shirt with Tape Details</p>
      <div className="flex flex-row items-center gap-2 ">
        <div className="relative  ">
          <Rate disabled defaultValue={2} starSize={10} />
        </div>
        <p className="text-[14]">4.5/5</p>
      </div>
      <p className="text-[24px] font-bold">$49.99</p>
    </div>
  );
};

export default ProductCard;
