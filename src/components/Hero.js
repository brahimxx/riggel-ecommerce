import Image from "next/image";
import Link from "next/link";

const Hero = () => {
  return (
    <div className=" bg-[#F2F0F1] overflow-hidden ">
      <div className="relative flex lg:flex-row flex-col h-[850px] lg:h-full max-w-screen-2xl mx-auto px-4 ">
        <div className=" flex flex-col gap-6 py-10 lg:w-[50%] xl:w-full lg:py-[50px] xl:py-[100px] z-1">
          <h1 className="font-integral leading-none text-[36px] lg:text-[40px] xl:text-[64px] font-extrabold">
            Find clothes
            <br /> that matches your style
          </h1>
          <p className="text-[14px] lg:text-4 text-black/60">
            Browse through our diverse range of meticulously crafted garments,
            designed to bring out your individuality and cater to your sense of
            style.
          </p>
          <Link
            href="/shop"
            className="text-white bg-black hover:bg-black/90 cursor-pointer w-full lg:w-[180px] font-medium rounded-full text-sm  py-3 text-center me-2 mb-2 "
          >
            Shop now
          </Link>
          <div className="flex flex-wrap lg:flex-nowrap justify-center gap-4 lg:justify-start items-center text-left">
            <div className="relative lg:px-4 pr-8 ">
              <p className="text-[24px] lg:text-[30px] xl:text-[40px] font-bold">
                200+
              </p>
              <p className="text-[11px] lg:text-[13px] xl:text-[16px] text-black/80">
                International Brands
              </p>
              <div className="absolute top-1/4 right-0 h-1/2 border-r border-gray-300"></div>
            </div>
            <div className="relative pl-8 lg:px-4 xl:px-8 ">
              <p className="text-[24px] lg:text-[30px] xl:text-[40px] font-bold">
                2,000+
              </p>
              <p className="text-[11px] lg:text-[13px] xl:text-[16px] text-black/80">
                High-Quality Products
              </p>
              <div className="absolute hidden lg:block top-1/4 right-0 h-1/2 border-r border-gray-300"></div>
            </div>
            <div className="px-8 lg:px-4">
              <p className="text-[24px] lg:text-[30px] xl:text-[40px] font-bold">
                30,000+
              </p>
              <p className="text-[11px] lg:text-[13px]  xl:text-[16px] text-black/80">
                Happy Customers
              </p>
            </div>
          </div>
        </div>

        <div className="absolute w-[320px] min-[325px]:scale-125 min-[498px]:scale-145 min-[498px]:h-[400px]  h-[320px]  sm:w-[500px] lg:scale-100 lg:w-[440px] lg:h-[440px] xl:w-[500px] xl:h-[500px] bottom-0 left-1/2 transform -translate-x-1/2 lg:left-auto lg:transform-none lg:translate-none lg:right-0 ">
          <Image
            src="/images/decorative_images/hero_image.png"
            alt="Hero image"
            quality={100}
            fill
            sizes="(max-width: 768px) 320px, (max-width: 1200px) 440px, 500px"
            className="object-contain "
            priority
          />
          <div className="absolute xl:w-[100px] xl:h-[100px] w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] lg:top-5 right-0 ">
            <Image
              src="/images/decorative_images/star.png"
              alt="star image"
              quality={100}
              fill
              sizes="(max-width: 768px) 60px, (max-width: 1200px) 80px, 100px"
              className="object-contain "
            />
          </div>
          <div className="absolute w-[30px] h-[30px]  bottom-50 sm:left-0 left-5 sm:w-[50px] sm:h-[50px]">
            <Image
              src="/images/decorative_images/star.png"
              alt="star image"
              quality={100}
              fill
              sizes="(max-width: 768px) 30px, (max-width: 1200px) 50px, 50px"
              className="object-contain "
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
