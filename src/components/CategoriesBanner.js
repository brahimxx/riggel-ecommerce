import Image from "next/image";

const CategoriesBanner = () => {
  return (
    <div className="mx-4">
      <div className="flex flex-col xl:h-[800px]  bg-[#F0F0F0] rounded-3xl max-w-screen-2xl xl:mx-auto pt-[70px] pb-[20px] xl:pb-auto xl:pt-auto lg:py-[40px] px-[24px] lg:px-[44px] xl:px-[64px] gap-[64px] ">
        <h2 className="self-center font-integral leading-none text-[32px] lg:text-[40px] xl:text-[48px] font-extrabold">
          Browse by dress style
        </h2>
        <div className="flex flex-col gap-[20px]">
          <div className="flex lg:flex-row flex-col gap-[20px]">
            <div className="relative lg:h-[290px] h-[190px] lg:w-[40%] rounded-4xl overflow-hidden">
              <p className="relative z-1 text-[24px] lg:text-[36px] font-bold p-[35px]">
                Casual
              </p>
              <Image
                src="/images/decorative_images/casual.png"
                alt="Casual category image"
                quality={100}
                fill
                className="object-cover "
              />
            </div>
            <div className="relative lg:h-[290px] h-[190px] lg:w-[60%] rounded-4xl overflow-hidden">
              <p className="relative z-1 text-[24px] lg:text-[36px] font-bold p-[35px]">
                Formal
              </p>
              <Image
                src="/images/decorative_images/formal.png"
                alt="Formal category image"
                quality={100}
                fill
                className="object-cover "
              />
            </div>
          </div>
          <div className="flex lg:flex-row flex-col gap-[20px]">
            <div className="relative lg:h-[290px] h-[190px] lg:w-[60%] rounded-4xl overflow-hidden">
              <p className="relative z-1 text-[24px] lg:text-[36px] font-bold p-[35px]">
                Party
              </p>
              <Image
                src="/images/decorative_images/party.png"
                alt="Party category image"
                quality={100}
                fill
                className="object-cover "
              />
            </div>
            <div className="relative lg:h-[290px] h-[190px] lg:w-[40%] rounded-4xl overflow-hidden">
              <p className="relative z-1 text-[24px] lg:text-[36px] font-bold p-[35px]">
                Gym
              </p>
              <Image
                src="/images/decorative_images/gym.png"
                alt="Gym category image"
                quality={100}
                fill
                className="object-cover "
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesBanner;
