// your-pages-directory/shop.js
"use client";
import "@ant-design/v5-patch-for-react-19";
import { useState, useEffect } from "react";
import { Pagination, Spin } from "antd";
import FilterSidebar from "@/components/FilterSidebar";
import ProductCard from "@/components/ProductCard";
import { getProducts, getCategories, getAttributes } from "@/lib/api";
import ShopHeader from "@/components/ShopHeader";
import { useSearchParams } from "next/navigation";

const PAGE_SIZE = 9; // Define a page size constant

const ShopPage = () => {
  // --- State for products and loading ---
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();

  // --- MODIFICATION: State for pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // --- State for filters ---
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // --- State for dynamic filter options ---
  const [allAvailableColors, setAllAvailableColors] = useState([]);
  const [allAvailableSizes, setAllAvailableSizes] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  // MODIFICATION: Add state for sorting
  const [sortBy, setSortBy] = useState("created_at_desc");

  // --- Effect for fetching initial filter data ---
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [categoriesData, attributesData] = await Promise.all([
          getCategories(),
          getAttributes(),
        ]);

        setAllCategories(categoriesData || []);

        // Extract colors and sizes from the attributes data
        const colorsAttr = attributesData.find(
          (attr) => attr.name.toLowerCase() === "color"
        );
        const sizesAttr = attributesData.find(
          (attr) => attr.name.toLowerCase() === "size"
        );

        if (colorsAttr) {
          setAllAvailableColors(colorsAttr.values.map((v) => v.value));
        }
        if (sizesAttr) {
          setAllAvailableSizes(sizesAttr.values.map((v) => v.value));
        }
      } catch (err) {
        console.error("Failed to fetch filter data:", err);
        // Set empty arrays as a fallback
        setAllCategories([]);
        setAllAvailableColors([]);
        setAllAvailableSizes([]);
      }
    };

    fetchFilterData();
  }, []);

  // --- Handler Functions ---
  const handleColorToggle = (color) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleSizeToggle = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handlePriceChange = (value) => {
    setPriceRange(value);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  };

  // MODIFICATION: Handler for page changes
  const onPageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  // MODIFICATION: Add handler for sorting
  const handleSortByChange = (value) => setSortBy(value);

  useEffect(() => {
    const fetchAndSetProducts = async () => {
      setIsLoading(true);
      setError(null);
      const query = searchParams.get("query");
      const filters = {
        colors: selectedColors,
        sizes: selectedSizes,
        price: priceRange,
        category_id: selectedCategory ? selectedCategory.category_id : null,
        query: query,
        page: currentPage,
        limit: PAGE_SIZE,
        sortBy: sortBy,
      };
      try {
        const response = await getProducts(filters);
        setProducts(response.products || []);
        setTotalProducts(response.total || 0);
      } catch (err) {
        setError("Failed to load products. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchAndSetProducts, 500);
    return () => clearTimeout(timer);
  }, [
    selectedColors,
    selectedSizes,
    priceRange,
    selectedCategory,
    currentPage,
    sortBy,
    searchParams,
  ]);

  // Effect 2: Resets the current page to 1 ONLY when a filter changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedColors,
    selectedSizes,
    priceRange,
    selectedCategory,
    sortBy,
    searchParams,
  ]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-10">
          <Spin size="large" />
        </div>
      );
    }
    if (error) {
      return <p className="text-red-500">{error}</p>;
    }
    if (products.length > 0) {
      console.log("Rendering products:", products);
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
            {products.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
          {/* MODIFICATION: Add the Pagination component */}
          <div className="mt-12 flex justify-center">
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={totalProducts}
              onChange={onPageChange}
              showSizeChanger={false} // Optional: hide the size changer
            />
          </div>
        </>
      );
    }
    return <p>No products found matching your criteria.</p>;
  };

  return (
    <div className="relative flex flex-row items-start max-w-screen-2xl mx-auto px-4 gap-8 mt-10 mb-20">
      <FilterSidebar
        priceRange={priceRange}
        onPriceChange={handlePriceChange}
        categories={allCategories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        colors={allAvailableColors}
        selectedColors={selectedColors}
        onColorToggle={handleColorToggle}
        sizes={allAvailableSizes}
        selectedSizes={selectedSizes}
        onSizeToggle={handleSizeToggle}
      />

      {/* Product Grid Area */}
      <div className="w-full lg:w-[80%]">
        {/* MODIFICATION: Add the ShopHeader component */}
        <ShopHeader
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          totalProducts={totalProducts}
          sortBy={sortBy}
          onSortByChange={handleSortByChange}
        />
        {renderContent()}
      </div>
    </div>
  );
};

export default ShopPage;
