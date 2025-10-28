// your-pages-directory/shop.js
"use client";
import { useState, useEffect } from "react";
import FilterSidebar from "@/components/FilterSidebar";
import ProductCard from "@/components/ProductCard"; // <-- 1. Import ProductCard
import { getProducts } from "@/lib/api";

const ShopPage = () => {
  // --- State for products and loading ---
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- State for filters ---
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // --- Data for filters (ideally fetched from the database) ---
  const allAvailableColors = [
    "black",
    "white",
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "yellow",
    "purple",
  ];
  const allAvailableSizes = [
    "XX-Small",
    "X-Small",
    "Small",
    "Medium",
    "Large",
    "X-Large",
    "XX-Large",
    "3X-Large",
    "4X-Large",
  ];
  const categories = ["T-shirt", "Shorts", "Shirts", "Hoddie", "Jeans"];

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
    // Toggle selection: if the same category is clicked again, deselect it.
    setSelectedCategory((prev) => (prev === category ? null : category));
  };

  // --- Effect for Fetching and Filtering Data ---
  useEffect(() => {
    const fetchAndSetProducts = async () => {
      setIsLoading(true);
      setError(null);
      const filters = {
        colors: selectedColors,
        sizes: selectedSizes,
        price: priceRange,
        // Add category to filters if one is selected
        // Note: This assumes your API can handle a category name. You might need to pass an ID.
        category: selectedCategory,
      };

      try {
        const fetchedProducts = await getProducts(filters);
        setProducts(fetchedProducts);
      } catch (err) {
        setError("Failed to load products. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce fetching to avoid too many API calls while user is interacting
    const timer = setTimeout(() => {
      fetchAndSetProducts();
    }, 500); // Wait 500ms after the last filter change before fetching

    return () => clearTimeout(timer); // Cleanup timer on unmount or re-render
  }, [selectedColors, selectedSizes, priceRange, selectedCategory]);

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) {
      // You can replace this with a more sophisticated skeleton loader
      return <p>Loading products...</p>;
    }
    if (error) {
      return <p className="text-red-500">{error}</p>;
    }
    if (products.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
          {products.map(
            (product) => (
              // 2. Use the ProductCard component here
              console.log(product),
              (<ProductCard key={product.product_id} product={product} />)
            )
          )}
        </div>
      );
    }
    return <p>No products found matching your criteria.</p>;
  };

  return (
    <div className="relative flex flex-row items-start max-w-screen-2xl mx-auto px-4 gap-8 mt-10 mb-20">
      <FilterSidebar
        priceRange={priceRange}
        onPriceChange={handlePriceChange}
        categories={categories}
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
      <div className="w-full lg:w-[80%]">{renderContent()}</div>
    </div>
  );
};

export default ShopPage;
