import ProductFeedBackCard from "@/components/ProductFeedBackCard";
import Link from "next/link";

const ProductReviewsTab = ({ reviews }) => {
  const feedbackItems = Array.isArray(reviews)
    ? reviews.map((r) => (
        <ProductFeedBackCard
          key={r.review_id}
          name={r.client_name || "Anonymous"}
          rating={r.rating}
          comment={r.comment}
          date={r.date}
        />
      ))
    : [];
  return (
    <div className="flex flex-col">
      <h2 className="text-2xl font-bold my-8">
        All Revies{" "}
        <span className=" text-black/60 font-normal">({reviews.length})</span>
      </h2>
      <div className="grid grid-cols-2 gap-y-3 justify-around">
        {feedbackItems}
      </div>
      {reviews.length > 6 && (
        <Link
          href="/products?sort=new"
          className="self-center font-semibold text-[16px] !text-black/90 mt-[36px] hover:!text-white hover:!bg-black cursor-pointer w-full lg:w-[230px] border border-black/20 rounded-full text-sm py-[10px] text-center"
        >
          Load More Reviews
        </Link>
      )}
    </div>
  );
};

export default ProductReviewsTab;
