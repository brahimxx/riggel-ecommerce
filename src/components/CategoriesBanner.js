import Image from "next/image";
import Link from "next/link";

const CategoriesBanner = () => {
  return (
    <div className="mx-4">
      <div className="flex flex-col xl:h-[800px] bg-[#F0F0F0] rounded-3xl max-w-screen-2xl xl:mx-auto py-[30px] xl:pb-auto xl:pt-auto lg:py-[40px] px-[24px] lg:px-[44px] xl:px-[64px] gap-[40px]">
        <h2 className="self-center font-integral leading-none text-[32px] lg:text-[40px] xl:text-[48px] font-extrabold">
          Browse by dress style
        </h2>
        <div className="flex flex-col gap-[20px]">
          <div className="flex lg:flex-row flex-col gap-[20px]">
            {/* Casual */}
            <Link
              href="/shop?category_id=29"
              className="relative group lg:h-[290px] h-[190px] lg:w-[40%] rounded-4xl overflow-hidden transition-all duration-500 ease-in-out hover:scale-105 hover:shadow-xl cursor-pointer"
            >
              <p className="relative z-10 text-[24px] lg:text-[36px] font-bold p-[35px] transition-all duration-500 group-hover:scale-110">
                Casual
              </p>
              <Image
                src="/images/decorative_images/casual.png"
                alt="Casual category image"
                quality={100}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-110"
                priority={false}
              />
            </Link>
            {/* Formal */}
            <Link
              href="/shop?category_id=30"
              className="relative group lg:h-[290px] h-[190px] lg:w-[60%] rounded-4xl overflow-hidden transition-all duration-500 ease-in-out hover:scale-102 hover:shadow-xl cursor-pointer"
            >
              <p className="relative z-10 text-[24px] lg:text-[36px] font-bold p-[35px] transition-all duration-500 group-hover:scale-105">
                Formal
              </p>
              <Image
                src="/images/decorative_images/formal.png"
                alt="Formal category image"
                quality={100}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-110"
                priority={false}
              />
            </Link>
          </div>
          <div className="flex lg:flex-row flex-col gap-[20px]">
            {/* Party */}
            <Link
              href="/shop?category_id=31"
              className="relative group lg:h-[290px] h-[190px] lg:w-[60%] rounded-4xl overflow-hidden transition-all duration-500 ease-in-out hover:scale-102 hover:shadow-xl cursor-pointer"
            >
              <p className="relative z-10 text-[24px] lg:text-[36px] font-bold p-[35px] transition-all duration-500 group-hover:scale-105">
                Party
              </p>
              <Image
                src="/images/decorative_images/party.png"
                alt="Party category image"
                quality={100}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-110"
                priority={false}
              />
            </Link>
            {/* Gym */}
            <Link
              href="/shop?category_id=32"
              className="relative group lg:h-[290px] h-[190px] lg:w-[40%] rounded-4xl overflow-hidden transition-all duration-500 ease-in-out hover:scale-105 hover:shadow-xl cursor-pointer"
            >
              <p className="relative z-10 text-[24px] lg:text-[36px] font-bold p-[35px] transition-all duration-500 group-hover:scale-110">
                Gym
              </p>
              <Image
                src="/images/decorative_images/gym.png"
                alt="Gym category image"
                quality={100}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-110"
                priority={false}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesBanner;
