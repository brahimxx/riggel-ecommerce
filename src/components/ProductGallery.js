"use client";
import React, { useState } from "react";
import Image from "next/image";

const ProductGallery = ({ images }) => {
  const [selected, setSelected] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div className="flex gap-8 items-start h-full p-1 max-h-[530px]">
      {/* Sidebar thumbnails */}
      <div className="flex flex-col w-[24%] gap-4 overflow-y-scroll hide-scrollbar">
        {images.map((image, idx) => (
          <button
            type="button"
            key={image.id}
            onClick={() => setSelected(idx)}
            aria-label={`Thumbnail ${idx + 1}`}
            className={`w-full !h-[164px] rounded-2xl border cursor-pointer ${
              selected === idx ? "border-black shadow-lg" : "border-gray-200"
            } bg-white p-1 transition relative`}
          >
            <Image
              src={image.url}
              alt={image.alt_text || `preview-${idx}`}
              fill
              className="object-cover rounded-2xl"
              priority={selected === idx}
            />
          </button>
        ))}
      </div>

      {/* Main product image */}
      <div className="flex-1 bg-[#F0EEED] rounded-[20px] w-[72%] h-full flex items-center justify-center relative min-h-[420px]">
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
