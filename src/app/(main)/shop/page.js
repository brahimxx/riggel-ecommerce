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
  const [selectedTypeCategories, setSelectedTypeCategories] = useState([]);
  const [selectedStyleCategories, setSelectedStyleCategories] = useState([]);

  const [allAvailableColors, setAllAvailableColors] = useState([]);
  const [allAvailableSizes, setAllAvailableSizes] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  const [sortBy, setSortBy] = useState(
    () => searchParams?.sortBy || "created_at_desc"
  );

  const [showOnSaleOnly, setShowOnSaleOnly] = useState(
    () => searchParams?.on_sale === "true"
  );

  // Helper to update URL search params incrementally
  const updateSearchParams = (key, value) => {
    const params = new URLSearchParams(window.location.search);

    if (
      value === null ||
      value === false ||
      (Array.isArray(value) && value.length === 0)
    ) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    // Sync sortBy from URL
    const urlSortBy = searchParams?.sortBy || "created_at_desc";
    if (urlSortBy !== sortBy) {
      setSortBy(urlSortBy);
    }
  }, [searchParams?.sortBy, sortBy]);

  useEffect(() => {
    // Fetch filter data once
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
    if (searchParams?.type_category_id) {
      setSelectedTypeCategories(
        allCategories.filter(
          (cat) =>
            (searchParams.type_category_id || "")
              .split(",")
              .includes(String(cat.category_id)) && cat.category_type === "type"
        )
      );
    } else {
      setSelectedTypeCategories([]);
    }
  }, [searchParams?.type_category_id, allCategories]);

  useEffect(() => {
    if (searchParams?.style_category_id) {
      setSelectedStyleCategories(
        allCategories.filter(
          (cat) =>
            (searchParams.style_category_id || "")
              .split(",")
              .includes(String(cat.category_id)) &&
            cat.category_type === "style"
        )
      );
    } else {
      setSelectedStyleCategories([]);
    }
  }, [searchParams?.style_category_id, allCategories]);

  // Synchronize favorites filter from URL
  useEffect(() => {
    setShowFavoritesOnly(searchParams?.favorites === "1");
  }, [searchParams?.favorites]);

  // Synchronize onSale filter from URL
  useEffect(() => {
    setShowOnSaleOnly(searchParams?.on_sale === "true");
  }, [searchParams?.on_sale]);

  // Synchronize colors array from URL
  useEffect(() => {
    const colors = searchParams?.colors ? searchParams.colors.split(",") : [];
    setSelectedColors(colors);
  }, [searchParams?.colors]);

  // Synchronize sizes array from URL
  useEffect(() => {
    const sizes = searchParams?.sizes ? searchParams.sizes.split(",") : [];
    setSelectedSizes(sizes);
  }, [searchParams?.sizes]);

  // Synchronize price range from URL ("min-max" format), fallback if missing
  useEffect(() => {
    if (searchParams?.price) {
      const [min, max] = searchParams.price.split("-").map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        setPriceRange([min, max]);
        return;
      }
    }
    setPriceRange([0, 500]);
  }, [searchParams?.price]);

  // Handlers update URL params and local state, reset page on change
  const handleFavoritesToggle = (checked) => {
    updateSearchParams("favorites", checked ? "1" : null);
    setShowFavoritesOnly(checked);
    setCurrentPage(1);
  };

  const handleOnSaleToggle = (e) => {
    const checked = e.target.checked;
    updateSearchParams("on_sale", checked ? "true" : null);
    setShowOnSaleOnly(checked);
    setCurrentPage(1);
  };

  const handleColorToggle = (color) => {
    let newColors = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color];
    updateSearchParams(
      "colors",
      newColors.length > 0 ? newColors.join(",") : null
    );
    setSelectedColors(newColors);
    setCurrentPage(1);
  };

  const handleSizeToggle = (size) => {
    let newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    updateSearchParams(
      "sizes",
      newSizes.length > 0 ? newSizes.join(",") : null
    );
    setSelectedSizes(newSizes);
    setCurrentPage(1);
  };

  const handlePriceChange = (value) => {
    updateSearchParams("price", `${value[0]}-${value[1]}`);
    setPriceRange(value);
    setCurrentPage(1);
  };

  const handleTypeCategoryToggle = (category) => {
    let newCats;
    if (
      selectedTypeCategories.some(
        (cat) => cat.category_id === category.category_id
      )
    ) {
      newCats = selectedTypeCategories.filter(
        (cat) => cat.category_id !== category.category_id
      );
    } else {
      newCats = [...selectedTypeCategories, category];
    }
    setSelectedTypeCategories(newCats);
    updateSearchParams(
      "type_category_id",
      newCats.length > 0
        ? newCats.map((cat) => cat.category_id).join(",")
        : null
    );
    setCurrentPage(1);
  };

  const handleStyleCategoryToggle = (category) => {
    let newCats;
    if (
      selectedStyleCategories.some(
        (cat) => cat.category_id === category.category_id
      )
    ) {
      newCats = selectedStyleCategories.filter(
        (cat) => cat.category_id !== category.category_id
      );
    } else {
      newCats = [...selectedStyleCategories, category];
    }
    setSelectedStyleCategories(newCats);
    updateSearchParams(
      "style_category_id",
      newCats.length > 0
        ? newCats.map((cat) => cat.category_id).join(",")
        : null
    );
    setCurrentPage(1);
  };

  const onPageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleSortByChange = (value) => {
    const params = new URLSearchParams(window.location.search);
    params.set("sortBy", value);
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setSortBy(value);
    setCurrentPage(1);
  };

  // Fetch products applying filters server-side except favorites which are filtered client-side
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
        type_category_id:
          selectedTypeCategories.length > 0
            ? selectedTypeCategories.map((c) => c.category_id).join(",")
            : null,
        style_category_id:
          selectedStyleCategories.length > 0
            ? selectedStyleCategories.map((c) => c.category_id).join(",")
            : null,
        query,
        page: isFavorites ? 1 : currentPage,
        limit: isFavorites ? 1000 : PAGE_SIZE,
        sortBy,
        onSale: showOnSaleOnly,
      };

      try {
        console.log("Sending filters to API:", filters);

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
    selectedStyleCategories,
    selectedTypeCategories,
    currentPage,
    sortBy,
    searchParams,
    showFavoritesOnly,
    showOnSaleOnly,
  ]);

  const favoriteProductIds = (favorites.items || []).map(
    (item) => item.productId
  );

  // Filter client-side only for favorites (assumed client-side only), all other filters server-side
  const filteredProducts = products.filter(
    (product) =>
      !showFavoritesOnly || favoriteProductIds.includes(product.product_id)
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-10 flex justify-center items-center h-[50vh]">
          <Spin size="large" />
        </div>
      );
    }
    if (error) {
      return <p className="text-red-500">{error}</p>;
    }
    if (filteredProducts.length > 0) {
      const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      );
      const totalToShow = filteredProducts.length;
      const showPagination = totalToShow > PAGE_SIZE;

      return (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
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
      <Suspense fallback={<div></div>}>
        <SearchParamsProvider onParamsChange={setSearchParams} />
      </Suspense>

      <div className="relative flex flex-row items-start max-w-screen-2xl mx-auto px-4 gap-4 mt-10 mb-20">
        <div className="lg:w-[20%] hidden lg:block">
          <FilterSidebar
            priceRange={priceRange}
            onPriceChange={handlePriceChange}
            categories={allCategories}
            selectedTypeCategories={selectedTypeCategories}
            selectedStyleCategories={selectedStyleCategories}
            handleTypeCategoryToggle={handleTypeCategoryToggle}
            handleStyleCategoryToggle={handleStyleCategoryToggle}
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
          selectedTypeCategories={selectedTypeCategories}
          selectedStyleCategories={selectedStyleCategories}
          handleTypeCategoryToggle={handleTypeCategoryToggle}
          handleStyleCategoryToggle={handleStyleCategoryToggle}
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
