import Image from "next/image";
import { Rate } from "antd";
import Link from "next/link";

const ProductCard = ({ product }) => {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="flex flex-col gap-1 w-[95%] "
    >
      <div className="relative w-full h-[270px] xl:w-[340px] xl:h-[295px] rounded-3xl overflow-hidden ">
        <Image
          src={product.main_image || "/images/products_images/product_test.png"}
          alt="product image"
          quality={100}
          fill
          className="object-fill  "
        />
      </div>
      <p className="text-[16px] lg:text-[20px] font-bold pt-2 lg:pt-0 lg:py-2">
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
      <p className="text-[20px] lg:text-[24px] font-bold">${product.price}</p>
    </Link>
  );
};

export default ProductCard;
