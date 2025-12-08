// components/FilterDrawer.js
"use client";
import { useEffect, useRef, useState } from "react";
import FilterSidebar from "@/components/FilterSidebar";

const FilterDrawer = ({
  showFilter,
  setShowFilter,
  priceRange,
  onPriceChange,
  categories,
  selectedTypeCategories,
  selectedStyleCategories,
  handleTypeCategoryToggle,
  handleStyleCategoryToggle,
  colors,
  selectedColors,
  onColorToggle,
  sizes,
  selectedSizes,
  onSizeToggle,
  showFavoritesOnly,
  onFavoritesToggle,
  showOnSaleOnly,
  onOnSaleToggle,
  onClearFilters,
}) => {
  const drawerRef = useRef(null);
  const contentRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const dragRef = useRef({
    startY: 0,
    currentY: 0,
    isDragging: false,
    isScrollAtTop: true,
  });

  // Handle entrance and exit animations
  useEffect(() => {
    if (showFilter) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTranslateY(0);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [showFilter]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showFilter &&
        drawerRef.current &&
        !drawerRef.current.contains(event.target)
      ) {
        setShowFilter(false);
      }
    };

    if (showFilter) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [showFilter, setShowFilter]);

  // Check if content is scrolled to top
  const checkScrollPosition = () => {
    if (contentRef.current) {
      dragRef.current.isScrollAtTop = contentRef.current.scrollTop === 0;
    }
  };

  // Handle drag to close - ONLY for drag handle
  const handleTouchStart = (e) => {
    checkScrollPosition();
    dragRef.current.startY = e.touches[0].clientY;
    dragRef.current.isDragging = true;
  };

  const handleTouchMove = (e) => {
    if (!dragRef.current.isDragging) return;

    dragRef.current.currentY = e.touches[0].clientY;
    const diff = dragRef.current.currentY - dragRef.current.startY;

    // Only allow dragging down when content is scrolled to top
    if (diff > 0 && dragRef.current.isScrollAtTop) {
      // Prevent default scrolling when dragging
      e.preventDefault();

      // Apply resistance for smoother feel
      const resistance = 0.5;
      setTranslateY(diff * resistance);
    }
  };

  const handleTouchEnd = () => {
    if (!dragRef.current.isDragging) return;

    const diff = dragRef.current.currentY - dragRef.current.startY;

    // If dragged down more than 150px, close the drawer
    if (diff > 150 && dragRef.current.isScrollAtTop) {
      setShowFilter(false);
    } else {
      // Snap back with spring animation
      setTranslateY(0);
    }

    dragRef.current.isDragging = false;
    dragRef.current.startY = 0;
    dragRef.current.currentY = 0;
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop with fade animation */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ease-out ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Drawer with slide-up animation - REMOVED touch handlers from here */}
      <div
        ref={drawerRef}
        className={`fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl max-h-[85vh] overflow-hidden lg:hidden ${
          isAnimating ? "" : "translate-y-full"
        }`}
        style={{
          transform:
            isAnimating && translateY > 0
              ? `translateY(${translateY}px)`
              : isAnimating
              ? "translateY(0)"
              : "translateY(100%)",
          transition: dragRef.current.isDragging
            ? "none"
            : "transform 400ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Drag handle - Touch handlers ONLY here now */}
        <div
          className="w-full py-4 flex justify-center touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full transition-all duration-200 active:w-16 active:bg-gray-400" />
        </div>

        {/* Filter content - No drag interference */}
        <div
          ref={contentRef}
          className="overflow-y-auto px-4 pb-6 overscroll-contain"
          style={{ maxHeight: "calc(85vh - 60px)" }}
          onScroll={checkScrollPosition}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Filters</h2>
            <button
              onClick={() => setShowFilter(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl transition-colors duration-200 hover:scale-110 active:scale-95"
            >
              ×
            </button>
          </div>

          <FilterSidebar
            priceRange={priceRange}
            onPriceChange={onPriceChange}
            categories={categories}
            selectedTypeCategories={selectedTypeCategories}
            selectedStyleCategories={selectedStyleCategories}
            handleTypeCategoryToggle={handleTypeCategoryToggle}
            handleStyleCategoryToggle={handleStyleCategoryToggle}
            colors={colors}
            selectedColors={selectedColors}
            onColorToggle={onColorToggle}
            sizes={sizes}
            selectedSizes={selectedSizes}
            onSizeToggle={onSizeToggle}
            showFavoritesOnly={showFavoritesOnly}
            onFavoritesToggle={onFavoritesToggle}
            showOnSaleOnly={showOnSaleOnly}
            onOnSaleToggle={onOnSaleToggle}
            onClearFilters={onClearFilters}
          />
        </div>
      </div>
    </>
  );
};

export default FilterDrawer;
