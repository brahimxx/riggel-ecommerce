"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";

const ProductGallery = ({ images }) => {
  const [selected, setSelected] = useState(0);
  // Create a ref to attach to our scrollable container
  const scrollContainerRef = useRef(null);

  if (!images || images.length === 0) return null;

  const handleThumbnailClick = (idx) => {
    setSelected(idx);

    const container = scrollContainerRef.current;
    if (!container) return;

    // Find the specific button that was clicked inside the container
    const button = container.querySelectorAll("button")[idx];
    if (button) {
      // Get the viewport (for screen size detection)
      const isMobile = window.innerWidth < 768; // Tailwind's md breakpoint

      if (isMobile) {
        // Horizontal scroll for mobile
        container.scrollTo({
          left:
            button.offsetLeft -
            container.offsetWidth / 2 +
            button.offsetWidth / 2,
          behavior: "smooth",
        });
      } else {
        // Vertical scroll for desktop
        container.scrollTo({
          top:
            button.offsetTop -
            container.offsetHeight / 2 +
            button.offsetHeight / 2,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-[12px] md:gap-8 items-start h-full lg:h-[530px]">
      {/* Attach the ref to the outer, scrollable div */}
      <div
        ref={scrollContainerRef}
        className="w-full md:w-[24%] md:h-full overflow-auto hide-scrollbar"
      >
        <div className="flex md:flex-col gap-[8px] md:gap-4">
          {images.map((image, idx) => (
            <button
              type="button"
              key={image.id}
              onClick={() => handleThumbnailClick(idx)} // Use the ref-based handler
              aria-label={`Thumbnail ${idx + 1}`}
              className={`w-[31%] h-[106px] md:w-full md:h-[164px] flex-shrink-0 rounded-2xl border cursor-pointer ${
                selected === idx ? "border-black shadow-md" : "border-gray-200"
              } bg-white p-1 transition relative`}
            >
              <Image
                src={image.url}
                alt={image.alt_text || `preview-${idx}`}
                fill
                sizes="(max-width: 768px) 32vw, 24vw"
                className="object-cover rounded-2xl"
                priority={selected === idx}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Main product image */}
      <div className="flex-1 bg-[#F0EEED] rounded-[20px] w-full h-[290px] md:w-[72%] md:h-full flex items-center justify-center relative md:min-h-[420px]">
        <Image
          src={images[selected].url}
          alt={images[selected].alt_text || "main-preview"}
          fill
          className="rounded-2xl object-cover"
          priority
        />
      </div>
    </div>
  );
};

export default ProductGallery;
