"use client";
import { useState, useEffect } from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

const MyCarousel = ({ items }) => {
  const [isMobile, setIsMobile] = useState(false); // Default to false

  useEffect(() => {
    // Check if window is defined (to avoid SSR issues)
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 1024);
      };

      // Set initial value
      handleResize();

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  const responsive = {
    largedesktop: {
      breakpoint: { max: 3000, min: 1440 },
      items: 4,
    },
    desktop: {
      breakpoint: { max: 1440, min: 1280 },
      items: 3,
    },
    tablet: {
      breakpoint: { max: 1280, min: 768 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 768, min: 0 },
      items: 1,
    },
  };

  return (
    <Carousel
      infinite={true}
      autoPlay={!isMobile}
      autoPlaySpeed={3000}
      responsive={responsive}
      ssr={true}
      removeArrowOnDeviceType={["tablet", "mobile"]}
    >
      {items}
    </Carousel>
  );
};

export default MyCarousel;
