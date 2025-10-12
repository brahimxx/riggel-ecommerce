"use client";
import { useState, useEffect } from "react";
import ProductFeedBackCard from "@/components/ProductFeedBackCard";

const ProductReviewsTab = ({ reviews }) => {
  // State to track if the component is mounted on the client
  const [isClient, setIsClient] = useState(false);
  // State to track the number of visible reviews, initialized to a default
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(6);

  // This effect runs only once on the client after initial render
  useEffect(() => {
    // Set isClient to true, indicating we are now on the client
    setIsClient(true);

    const updateVisibleCount = () => {
      const width = window.innerWidth;
      let count;
      if (width < 640) {
        count = 3; // Mobile: Show 3
      } else if (width < 1024) {
        count = 4; // Tablet: Show 4
      } else {
        count = 6; // Desktop: Show 6
      }
      setVisibleReviewsCount(count);
    };

    // Set the correct count on initial client load
    updateVisibleCount();

    // Add listener for window resize
    window.addEventListener("resize", updateVisibleCount);

    // Cleanup listener on component unmount
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []); // Empty dependency array ensures this runs only once on mount

  // Load more function
  const loadMoreReviews = () => {
    setVisibleReviewsCount((prevCount) => prevCount + 3);
  };

  // Only render the review items if on the client to avoid mismatch
  const reviewItems =
    isClient && Array.isArray(reviews)
      ? reviews
          .slice(0, visibleReviewsCount)
          .map((r) => (
            <ProductFeedBackCard
              key={r.review_id}
              name={r.client_name || "Anonymous"}
              rating={r.rating}
              comment={r.comment}
              date={r.date}
            />
          ))
      : []; // Render an empty array on the server and initial client render

  const showLoadMoreButton =
    isClient && Array.isArray(reviews) && reviews.length > visibleReviewsCount;

  return (
    <div className="flex flex-col">
      <h2 className="text-[20px] lg:text-2xl font-bold my-[24px] lg:my-8">
        All Reviews{" "}
        <span className="text-black/60 font-normal">
          ({reviews ? reviews.length : 0})
        </span>
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-3 justify-around">
        {reviewItems}
      </div>

      {showLoadMoreButton && (
        <button
          onClick={loadMoreReviews}
          className="self-center font-semibold text-[16px] !text-black/90 mt-[36px] hover:!text-white hover:!bg-black cursor-pointer w-full lg:w-[230px] border border-black/20 rounded-full text-sm py-[10px] text-center"
        >
          Load More Reviews
        </button>
      )}
    </div>
  );
};

export default ProductReviewsTab;
