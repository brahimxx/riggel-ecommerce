import Image from "next/image";

const Separater = () => {
  return (
    <div className="flex flex-row justify-around bg-black h-20 items-center">
      <div className="relative w-[150px] h-[35px] ">
        <Image
          src="/images/decorative_images/decorative_logos/calvin.png"
          alt="brand logo image"
          quality={100}
          fill
          className="object-contain "
        />
      </div>
      <div className="relative w-[150px] h-[35px] ">
        <Image
          src="/images/decorative_images/decorative_logos/gucci.png"
          alt="brand logo image"
          quality={100}
          fill
          className="object-contain "
        />
      </div>
      <div className="relative w-[150px] h-[35px] ">
        <Image
          src="/images/decorative_images/decorative_logos/prada.png"
          alt="brand logo image"
          quality={100}
          fill
          className="object-contain "
        />
      </div>
      <div className="relative w-[150px] h-[35px] ">
        <Image
          src="/images/decorative_images/decorative_logos/versace.png"
          alt="brand logo image"
          quality={100}
          fill
          className="object-contain "
        />
      </div>
      <div className="relative w-[150px] h-[35px] ">
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
