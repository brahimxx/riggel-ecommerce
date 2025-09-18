import Image from "next/image";
const Hero = () => {
  return (
    <div className=" bg-[#F2F0F1] overflow-hidden">
      <div className="relative flex  max-w-screen-2xl mx-auto ">
        <div className=" flex flex-col gap-6 py-[100px] z-1">
          <h1 className="font-integral leading-none text-[64px] font-extrabold">
            Find clothes
            <br /> that matches your style
          </h1>
          <p className="text-4 text-black/60">
            Browse through our diverse range of meticulously crafted garments,
            designed to bring out your individuality and cater to your sense of
            style.
          </p>
          <button
            type="button"
            className="text-white bg-black hover:bg-black/90 cursor-pointer w-[180px]  focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm  py-3 text-center me-2 mb-2 "
          >
            Shop now
          </button>
          <div className="flex items-center text-left">
            <div className="relative pr-8 ">
              <p className="text-[40px] font-bold">200+</p>
              <p className="text-[16px] text-black/60">International Brands</p>
              <div className="absolute top-1/4 right-0 h-1/2 border-r border-gray-300"></div>
            </div>
            <div className="relative px-8 ">
              <p className="text-[40px] font-bold">2,000+</p>
              <p className="text-[16px] text-black/60">High-Quality Products</p>
              <div className="absolute top-1/4 right-0 h-1/2 border-r border-gray-300"></div>
            </div>
            <div className="px-8 ">
              <p className="text-[40px] font-bold">30,000+</p>
              <p className="text-[16px] text-black/60">Happy Customers</p>
            </div>
          </div>
        </div>
        <div className="absolute w-[500px] h-[500px] bottom-0 right-20 ">
          <Image
            src="/images/decorative_images/hero_image.png"
            alt="Hero image"
            quality={100}
            fill
            className="object-contain "
          />
          <div className="absolute w-[100px] h-[100px] top-5 right-0 ">
            <Image
              src="/images/decorative_images/star.png"
              alt="star image"
              quality={100}
              fill
              className="object-contain "
            />
          </div>
          <div className="absolute w-[40px] h-[40px] bottom-50 left-0 ">
            <Image
              src="/images/decorative_images/star.png"
              alt="star image"
              quality={100}
              fill
              className="object-contain "
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
