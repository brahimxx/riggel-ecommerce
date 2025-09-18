import ProductCard from "./ProductCard";

const NewArrivals = () => {
  return (
    <div className="flex flex-col py-[72px] max-w-screen-2xl mx-auto">
      <h2 className="self-center font-integral leading-none text-[48px] font-extrabold">
        New Arrivals
      </h2>
      <div className="flex justify-between py-[55px]">
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
      </div>
      <button
        type="button"
        className="self-center font-semibold text-black hover:text-white hover:bg-black cursor-pointer w-[180px] border-1 border-black/20   rounded-full text-sm  py-3 text-center me-2 mb-2 "
      >
        View All
      </button>
    </div>
  );
};

export default NewArrivals;
