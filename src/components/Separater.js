import Image from "next/image";

const Separater = () => {
  return (
    <div className="flex flex-row flex-wrap py-1 lg:py-0 gap-x-5 lg:gap-0 justify-center  lg:justify-around bg-black lg:h-20 items-center">
      <div className="relative w-[80px] h-[30px] lg:w-[150px] lg:h-[35px] ">
        <Image
          src="/images/decorative_images/decorative_logos/calvin.png"
          alt="brand logo image"
          quality={100}
          fill
          className="object-contain "
        />
      </div>
      <div className="relative w-[80px] h-[30px] lg:w-[150px] lg:h-[35px] ">
        <Image
          src="/images/decorative_images/decorative_logos/gucci.png"
          alt="brand logo image"
          quality={100}
          fill
          className="object-contain "
        />
      </div>
      <div className="relative w-[80px] h-[30px] lg:w-[150px] lg:h-[35px] ">
        <Image
          src="/images/decorative_images/decorative_logos/prada.png"
          alt="brand logo image"
          quality={100}
          fill
          className="object-contain "
        />
      </div>
      <div className="relative w-[80px] h-[30px] lg:w-[150px] lg:h-[35px] ">
        <Image
          src="/images/decorative_images/decorative_logos/versace.png"
          alt="brand logo image"
          quality={100}
          fill
          className="object-contain "
        />
      </div>
      <div className="relative w-[80px] h-[25px] lg:w-[150px] lg:h-[35px] ">
        <Image
          src="/images/decorative_images/decorative_logos/zara.png"
          alt="brand logo image"
          quality={100}
          fill
          className="object-contain "
        />
      </div>
    </div>
  );
};

export default Separater;
