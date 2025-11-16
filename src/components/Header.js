"use client";
import React, { useState, useEffect } from "react";
import { CloseOutlined, LinkOutlined, MenuOutlined } from "@ant-design/icons";
import Link from "next/link";
import SearchBar from "./SearchBar";
import CartIcon from "./CartIcon";

const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
          <Link
            href="/"
            className="flex items-center space-x-3 rtl:space-x-reverse"
          >
            <span className="font-integral self-center text-2xl font-semibold whitespace-nowrap">
              SHOP.CO
            </span>
          </Link>
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
          <div className="flex flex-row gap-5 items-center">
            <div className="flex">
              <SearchBar />
              <button
                onClick={toggleDrawer}
                type="button"
                className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                aria-controls="mobile-drawer"
                aria-expanded={isDrawerOpen}
              >
                <span className="sr-only">Open main menu</span>
                <MenuOutlined className="text-xl" />
              </button>
            </div>
            <Link href="/shoppingcart" className="text-gray-900">
              <CartIcon className="text-2xl cursor-pointer transition-transform duration-200 ease-in-out hover:scale-110" />
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
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-l border-[#F0EEED]">
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
                  href="#"
                  onClick={toggleDrawer}
                  className="block py-3 px-4 text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  On sale
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={toggleDrawer}
                  className="block py-3 px-4 text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  New Arrivals
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={toggleDrawer}
                  className="block py-3 px-4 text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Brands
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
