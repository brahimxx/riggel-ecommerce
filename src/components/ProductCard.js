import Image from "next/image";
import { Rate } from "antd";

const ProductCard = ({ product }) => {
  return (
    <div className="flex flex-col gap-1 ">
      <div className="relative w-[295px] h-[295px] rounded-3xl overflow-hidden ">
        <Image
          src={product.main_image || "/images/products_images/product_test.png"}
          alt="product image"
          quality={100}
          fill
          className="object-contain "
        />
      </div>
      <p className="text-[20px] font-bold py-2">{product.name}</p>
      <div className="flex flex-row items-center gap-2 ">
        <div className="relative  ">
          <Rate disabled allowHalf defaultValue={Number(product.rating) || 0} />
        </div>
        <p className="text-[14]">{product.rating}/5</p>
      </div>
      <p className="text-[24px] font-bold">${product.price}</p>
    </div>
  );
};

export default ProductCard;
