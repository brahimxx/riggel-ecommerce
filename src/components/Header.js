"use client";
import React, { useState, useEffect } from "react";
import { CloseOutlined, MenuOutlined } from "@ant-design/icons";
import Link from "next/link";
import SearchBar from "./SearchBar";
import CartIcon from "./CartIcon";
import { Suspense } from "react";
import Image from "next/image";

const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [startAnim, setStartAnim] = useState(false);

  useEffect(() => {
    const triggerAnimation = () => {
      // Double rAF ensures browser has completed painting
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setStartAnim(true);
        });
      });
    };

    // Wait for window load AND ensure DOM is interactive
    if (document.readyState === "complete") {
      // Add small delay to ensure styles are applied
      triggerAnimation();
    } else {
      const handleLoad = () => {
        triggerAnimation();
      };
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-30 border-gray-200 transition-all duration-300 ease-in-out ${
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between max-w-screen-2xl mx-auto py-6 px-4">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleDrawer}
              type="button"
              className="inline-flex items-center py-2 h-10 justify-center text-sm mt-[2px]  text-black rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
              aria-controls="mobile-drawer"
              aria-expanded={isDrawerOpen}
            >
              <span className="sr-only">Open main menu</span>
              <MenuOutlined className="text-xl" />
            </button>
            <Link href="/" className="flex items-center overflow-hidden">
              {/* R logo */}
              <div
                className={`bg-white z-10 ${startAnim ? "riggel-logo-bg" : ""}`}
              >
                <Image
                  src="/logo.png"
                  alt="Riggel Logo"
                  width={40}
                  height={40}
                  priority
                />
              </div>

              {/* Wrapper for fade + text */}
              <div className="relative flex items-center">
                {/* Static fade strip from right edge of the image */}
                <div className="z-20 pointer-events-none absolute left-0 top-0 h-full w-8" />
                <span
                  className={`font-integral text-[#669900] ml-[2px] opacity-0 text-2xl font-bold whitespace-nowrap ${
                    startAnim ? "riggel-text-slide" : ""
                  }`}
                >
                  iggel
                </span>
              </div>
            </Link>
          </div>

          <div
            className="items-center justify-between hidden w-full md:flex md:w-auto"
            id="navbar-search"
          >
            <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent">
              <li>
                <Link
                  href="/shop"
                  className="block py-2 px-3 text-white rounded-sm md:bg-transparent md:text-black md:p-0 transition-transform duration-200 ease-in-out hover:scale-110"
                  aria-current="page"
                >
                  Shop
                </Link>
              </li>
              <li>
                <a
                  href="/shop?on_sale=true"
                  className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:p-0 transition-transform duration-200 ease-in-out hover:scale-110"
                >
                  On sale
                </a>
              </li>
              <li>
                <a
                  href="/shop?sortBy=created_at_desc"
                  className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:p-0 transition-transform duration-200 ease-in-out hover:scale-110"
                >
                  New Arrivals
                </a>
              </li>
              <li>
                <a
                  href={`/shop?favorites=1`}
                  className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:p-0 transition-transform duration-200 ease-in-out hover:scale-110"
                >
                  Favorites
                </a>
              </li>
            </ul>
          </div>
          <div className="flex flex-row  items-center justify-center ">
            <div className="flex md:min-w-[200px]">
              <Suspense
                fallback={
                  <div style={{ textAlign: "center", padding: "20px" }}></div>
                }
              >
                <SearchBar />
              </Suspense>
            </div>
            <Link href="/shoppingcart" className="text-gray-900 ">
              <CartIcon className="text-2xl  cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content jump */}
      <div className="h-[88px]"></div>

      {/* Overlay - lighter and allows seeing content behind */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden backdrop-blur-sm"
          onClick={toggleDrawer}
        ></div>
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full border-r border-r-[#F0EEED]">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-b-[#F0EEED]">
            <span className="font-integral text-xl font-semibold">Menu</span>
            <button
              onClick={toggleDrawer}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <CloseOutlined className="text-xl" />
            </button>
          </div>

          {/* Drawer Content */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="flex flex-col space-y-2">
              <li>
                <Link
                  href="/shop"
                  onClick={toggleDrawer}
                  className="block py-3 px-4 text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Shop
                </Link>
              </li>
              <li>
                <a
                  href="/shop?on_sale=true"
                  onClick={toggleDrawer}
                  className="block py-3 px-4 text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  On sale
                </a>
              </li>
              <li>
                <a
                  href="/shop?sortBy=created_at_desc"
                  onClick={toggleDrawer}
                  className="block py-3 px-4 text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  New Arrivals
                </a>
              </li>
              <li>
                <a
                  href={`/shop?favorites=1`}
                  onClick={toggleDrawer}
                  className="block py-3 px-4 text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Favorites
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Header;
