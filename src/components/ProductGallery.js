"use client";
import React, { useRef, useEffect } from "react";
import Image from "next/image";

const ProductGallery = ({ images, selectedIndex = 0, onSelect }) => {
  const scrollContainerRef = useRef(null);

  // 1. Add this useEffect to trigger scroll whenever selectedIndex changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Find the thumbnail button corresponding to the selected index
    const button = container.querySelectorAll("button")[selectedIndex];
    if (!button) return;

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      container.scrollTo({
        left:
          button.offsetLeft -
          container.offsetWidth / 2 +
          button.offsetWidth / 2,
        behavior: "smooth",
      });
    } else {
      container.scrollTo({
        top:
          button.offsetTop -
          container.offsetHeight / 2 +
          button.offsetHeight / 2,
        behavior: "smooth",
      });
    }
  }, [selectedIndex]); // Run this every time selectedIndex updates

  if (!images || images.length === 0) return null;

  return (
    <div className="flex flex-col-reverse md:flex-row gap-[12px] md:gap-8 items-start h-full lg:h-[530px]">
      {/* Thumbnails */}
      <div
        ref={scrollContainerRef}
        className="w-full md:w-[24%] md:h-full overflow-auto hide-scrollbar"
      >
        <div className="flex md:flex-col gap-[8px] md:gap-4">
          {images.map((image, idx) => (
            <button
              type="button"
              key={image.id}
              onClick={() => onSelect?.(idx)} // 2. Simplified handler, let useEffect do the scrolling
              aria-label={`Thumbnail ${idx + 1}`}
              className={`w-[31%] h-[106px] min-[400px]:w-[21.5vw] min-[460px]:w-[22vw] min-[600px]:w-[22.7vw] min-[580px]:h-[130px] md:w-full md:h-[164px] flex-shrink-0 rounded-2xl border cursor-pointer ${
                selectedIndex === idx
                  ? "border-black shadow-md"
                  : "border-gray-200"
              } bg-white p-1 transition relative`}
            >
              <Image
                src={image.url}
                alt={image.alt_text || `preview-${idx}`}
                fill
                sizes="(max-width: 768px) 32vw, 24vw"
                className="object-cover rounded-2xl"
                priority={selectedIndex === idx}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Main product image */}
      <div className="flex-1 bg-[#F0EEED] rounded-[20px] w-full h-[290px] md:w-[72%] md:h-full flex items-center justify-center relative md:min-h-[420px] ">
        <Image
          src={images[selectedIndex].url}
          alt={images[selectedIndex].alt_text || "main-preview"}
          fill
          className="rounded-2xl object-cover"
          priority
        />
      </div>
    </div>
  );
};

export default ProductGallery;
