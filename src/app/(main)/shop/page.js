"use client";
import "@ant-design/v5-patch-for-react-19";
import { useState, useEffect } from "react";
import { Pagination, Spin } from "antd";
import FilterSidebar from "@/components/FilterSidebar";
import FilterDrawer from "@/components/FilterDrawer"; // Add this import
import ProductCard from "@/components/ProductCard";
import { getProducts, getCategories, getAttributes } from "@/lib/api";
import ShopHeader from "@/components/ShopHeader";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useFavorites } from "@/hooks/useFavorites";

const PAGE_SIZE = 12;

const ShopPage = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { favorites, isLoaded } = useFavorites();
  const [showFavorites, setShowFavorites] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [allAvailableColors, setAllAvailableColors] = useState([]);
  const [allAvailableSizes, setAllAvailableSizes] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  const [sortBy, setSortBy] = useState(() => {
    return searchParams.get("sortBy") || "created_at_desc";
  });

  useEffect(() => {
    const urlSortBy = searchParams.get("sortBy") || "created_at_desc";
    if (urlSortBy !== sortBy) {
      setSortBy(urlSortBy);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [categoriesData, attributesData] = await Promise.all([
          getCategories(),
          getAttributes(),
        ]);

        setAllCategories(categoriesData || []);

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
        setAllCategories([]);
        setAllAvailableColors([]);
        setAllAvailableSizes([]);
      }
    };

    fetchFilterData();
  }, []);

  // After setAllCategories
  useEffect(() => {
    if (allCategories.length) {
      const urlCategoryId = searchParams.get("category_id");
      if (urlCategoryId) {
        const found = allCategories.find(
          (cat) => String(cat.category_id) === urlCategoryId
        );
        if (
          found &&
          (!selectedCategory ||
            found.category_id !== selectedCategory.category_id)
        ) {
          setSelectedCategory(found);
        }
      } else {
        setSelectedCategory(null);
      }
    }
    // eslint-disable-next-line
  }, [allCategories, searchParams]);

  const handleFavoritesToggle = (checked) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("favorites", "1");
    } else {
      params.delete("favorites");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setShowFavoritesOnly(checked);
  };

  useEffect(() => {
    setShowFavoritesOnly(searchParams.get("favorites") === "1");
  }, [searchParams]);

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

  const onPageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleSortByChange = (value) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", value);
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setSortBy(value);
    setCurrentPage(1);
  };

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

  const favoriteProductIds = (favorites.items || []).map(
    (item) => item.productId
  );
  const filteredProducts = showFavoritesOnly
    ? products.filter((product) =>
        favoriteProductIds.includes(product.product_id)
      )
    : products;

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
    if (filteredProducts.length > 0) {
      return (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2  lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={totalProducts}
              onChange={onPageChange}
              showSizeChanger={false}
            />
          </div>
        </>
      );
    }
    return <p>No products found matching your criteria.</p>;
  };

  return (
    <div className="relative flex flex-row items-start max-w-screen-2xl mx-auto px-4 gap-4 mt-10 mb-20">
      {/* Desktop sidebar */}
      <div className="lg:w-[20%] hidden lg:block">
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
          showFavoritesOnly={showFavoritesOnly}
          onFavoritesToggle={(e) => handleFavoritesToggle(e.target.checked)}
        />
      </div>

      {/* Mobile filter drawer - Add this */}
      <FilterDrawer
        showFilter={showFilter}
        setShowFilter={setShowFilter}
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
        <ShopHeader
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          totalProducts={totalProducts}
          sortBy={sortBy}
          onSortByChange={handleSortByChange}
          setShowFilter={setShowFilter}
          showFilter={showFilter}
        />
        {renderContent()}
      </div>
    </div>
  );
};

export default ShopPage;
