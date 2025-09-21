"use client";
import { useState, useEffect } from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

const MyCarousel = ({
  items,
  partialVisible = false,
  numberOfItems = [5, 3, 2, 1],
}) => {
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
      items: numberOfItems[0],
    },
    desktop: {
      breakpoint: { max: 1440, min: 1280 },
      items: numberOfItems[1],
    },
    tablet: {
      breakpoint: { max: 1280, min: 768 },
      items: numberOfItems[2],
      partialVisibilityGutter: 30,
    },
    mobile: {
      breakpoint: { max: 768, min: 0 },
      items: numberOfItems[3],
      partialVisibilityGutter: 20,
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
      partialVisible={partialVisible}
    >
      {items}
    </Carousel>
  );
};

export default MyCarousel;
