"use client";
import "@ant-design/v5-patch-for-react-19";
import { useState, useEffect, Suspense } from "react";
import { Pagination, Spin } from "antd";
import FilterSidebar from "@/components/FilterSidebar";
import FilterDrawer from "@/components/FilterDrawer";
import ProductCard from "@/components/ProductCard";
import { getProducts, getCategories, getAttributes } from "@/lib/api";
import ShopHeader from "@/components/ShopHeader";
import { useRouter, usePathname } from "next/navigation";
import { useFavorites } from "@/hooks/useFavorites";
import SearchParamsProvider from "@/components/SearchParamsProvider";

const PAGE_SIZE = 12;

const ShopPage = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState({});
  const router = useRouter();
  const pathname = usePathname();

  const { favorites, isLoaded } = useFavorites();
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
    return searchParams?.sortBy || "created_at_desc";
  });

  const [showOnSaleOnly, setShowOnSaleOnly] = useState(
    () => searchParams?.on_sale === "true"
  );

  useEffect(() => {
    const urlSortBy = searchParams?.sortBy || "created_at_desc";
    if (urlSortBy !== sortBy) {
      setSortBy(urlSortBy);
    }
  }, [searchParams, sortBy]);

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

  useEffect(() => {
    if (allCategories.length) {
      const urlCategoryId = searchParams?.category_id;
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
    const params = new URLSearchParams(searchParams);

    if (checked) {
      params.set("favorites", "1");
    } else {
      params.delete("favorites");
    }

    // Immediately show loading state and clear old page data
    setIsLoading(true);
    setProducts([]);
    setTotalProducts(0);
    setCurrentPage(1);
    setShowFavoritesOnly(checked);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setShowFavoritesOnly(searchParams?.favorites === "1");
  }, [searchParams]);

  // ✅ FIXED: Reset page inside handler
  const handleColorToggle = (color) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
    setCurrentPage(1); // ✅ Reset page immediately
  };

  const handleOnSaleToggle = (e) => {
    const checked = e.target.checked;
    const params = new URLSearchParams(searchParams);
    if (checked) {
      params.set("on_sale", "true");
    } else {
      params.delete("on_sale");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setShowOnSaleOnly(checked);
    setCurrentPage(1); // ✅ Reset page immediately
  };

  // ✅ FIXED: Reset page inside handler
  const handleSizeToggle = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
    setCurrentPage(1); // ✅ Reset page immediately
  };

  // ✅ FIXED: Reset page inside handler
  const handlePriceChange = (value) => {
    setPriceRange(value);
    setCurrentPage(1); // ✅ Reset page immediately
  };

  // ✅ FIXED: Reset page inside handler
  const handleCategorySelect = (category) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
    setCurrentPage(1); // ✅ Reset page immediately
  };

  const onPageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleSortByChange = (value) => {
    const params = new URLSearchParams(searchParams);
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
      const query = searchParams?.query;
      const isFavorites = showFavoritesOnly;
      const filters = {
        colors: selectedColors,
        sizes: selectedSizes,
        price: priceRange,
        category_id: selectedCategory ? selectedCategory.category_id : null,
        query: query,
        page: isFavorites ? 1 : currentPage,
        limit: isFavorites ? 1000 : PAGE_SIZE,
        sortBy: sortBy,
        onSale: showOnSaleOnly,
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
    showFavoritesOnly,
    showOnSaleOnly,
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
      const paginatedProducts = showFavoritesOnly
        ? filteredProducts.slice(
            (currentPage - 1) * PAGE_SIZE,
            currentPage * PAGE_SIZE
          )
        : filteredProducts;
      const totalToShow = showFavoritesOnly
        ? filteredProducts.length
        : totalProducts;
      const showPagination = totalToShow > PAGE_SIZE;
      return (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2  lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
          {showPagination && (
            <div className="mt-12 flex justify-center">
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={totalToShow}
                onChange={onPageChange}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      );
    }
    return <p>No products found matching your criteria.</p>;
  };

  return (
    <>
      <Suspense
        fallback={
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin size="large" />
          </div>
        }
      >
        <SearchParamsProvider onParamsChange={setSearchParams} />
      </Suspense>

      <div className="relative flex flex-row items-start max-w-screen-2xl mx-auto px-4 gap-4 mt-10 mb-20">
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
            showOnSaleOnly={showOnSaleOnly}
            onOnSaleToggle={handleOnSaleToggle}
          />
        </div>

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
          showOnSaleOnly={showOnSaleOnly}
          onOnSaleToggle={handleOnSaleToggle}
          showFavoritesOnly={showFavoritesOnly}
          onFavoritesToggle={(e) => handleFavoritesToggle(e.target.checked)}
        />

        <div className="w-full lg:w-[80%]">
          <ShopHeader
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalProducts={
              showFavoritesOnly ? filteredProducts.length : totalProducts
            }
            sortBy={sortBy}
            onSortByChange={handleSortByChange}
            setShowFilter={setShowFilter}
            showFilter={showFilter}
          />
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default ShopPage;
