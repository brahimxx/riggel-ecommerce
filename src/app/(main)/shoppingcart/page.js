"use client";
import {
  ArrowLeftOutlined,
  ShoppingOutlined,
  PercentageOutlined,
  CreditCardOutlined,
  TruckOutlined,
  SafetyOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useCartContext } from "@/components/CartContext";

import CartProductCard from "@/components/CartProductCard";

const shoppingcart = () => {
  const { cart, updateQuantity, removeFromCart } = useCartContext();

  const subtotal = cart.items
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <div className="relative flex flex-col items-start justify-start lg:h-full max-w-screen-2xl mx-auto px-4 gap-8 mt-10 mb-20">
        <Link
          href="/shop"
          className="font-semibold text-black hover:text-white hover:bg-black cursor-pointer w-full lg:w-[180px] rounded-full text-sm py-[10px] text-center"
        >
          <ArrowLeftOutlined /> Continue Shopping
        </Link>

        <div className="flex flex-col lg:flex-row w-full justify-between ">
          <div className="flex flex-col lg:w-[60%] ">
            <div className="p-4 border-1 border-gray-300/60 rounded-2xl mb-8">
              <div>
                <ShoppingOutlined /> Shopping Cart ({totalItems} items)
              </div>

              <div className="flex flex-col w-full">
                {cart.items.length > 0 ? (
                  cart.items.map((item, index) => (
                    <div
                      key={`${item.productId}-${item.variantId || ""}`}
                      className={`${
                        index !== cart.items.length - 1
                          ? "border-b border-gray-300/60"
                          : ""
                      }`}
                    >
                      <CartProductCard
                        product={item}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeFromCart}
                      />
                    </div>
                  ))
                ) : (
                  <p>Your shopping cart is empty.</p>
                )}
              </div>
            </div>
            <div className="p-4 flex flex-col gap-4 justify-between border-1 border-gray-300/60 rounded-2xl">
              <div className="flex gap-4">
                <MessageOutlined style={{ color: "#3A3A3A" }} />
                <p>Special Instructions</p>
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block mb-2 text-sm font-medium "
                >
                  Add a note to your order (optional)
                </label>
                <textarea
                  id="message"
                  rows="4"
                  className="block p-2.5 w-full text-sm  bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500  "
                  placeholder="Any special requests, gift messages, or packaging instructions..."
                ></textarea>
              </div>
              <p className="text-[13px] text-gray-600">
                Examples: "Please gift wrap this item", "This is a gift for my
                mother", "Handle with extra care"
              </p>
            </div>
          </div>

          <div className="lg:w-[38%] flex flex-col gap-6  mt-8 lg:mt-0">
            <div className="p-4 flex flex-col justify-between border-1 border-gray-300/60 rounded-2xl h-[160px] ">
              <p className="flex gap-2">
                <PercentageOutlined />
                Promo Code
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex gap-4">
                  <input
                    type="text"
                    id="search-navbar"
                    className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-full bg-gray-50 focus:ring-blue-500 focus:border-blue-500 "
                    placeholder="Enter promo code"
                  />
                  <button className="bg-black text-white rounded-full  py-2 text-lg font-medium transition cursor-pointer  w-[150px]">
                    Apply
                  </button>
                </div>
                <p className="text-[14px] text-gray-800/70">
                  Try: BOTANICAL10, SPRING15, or FIRST20
                </p>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-4 justify-between border-1 border-gray-300/60 rounded-2xl">
              <p>Order Summary</p>
              <div className="flex flex-col pb-4 border-b-1 border-gray-300/60 gap-4">
                <div className="flex justify-between">
                  <p>Subtotal ({totalItems} items)</p>
                  <p>${subtotal}</p>
                </div>
                <div className="flex justify-between">
                  <p>Tax (1.1%)</p>
                  <p>${(subtotal * 0.011).toFixed(2)} </p>
                </div>
                <div className="flex justify-between">
                  <p>Shipping</p>
                  <p>{subtotal >= 200 ? "Free" : "$15.00"}</p>
                </div>
              </div>
              <div className="flex justify-between text-[18px] font-bold">
                <p>Total</p>
                <p>${(subtotal * 0.011 + Number(subtotal) + 15).toFixed(2)}</p>
              </div>
              <button className="bg-black text-white rounded-full  py-2 text-lg font-medium transition cursor-pointer  ">
                <CreditCardOutlined className="mr-3" /> Proceed to Checkout
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4 justify-between border-1 border-gray-300/60 rounded-2xl">
              <div className="flex gap-4">
                <TruckOutlined
                  className="text-[28px]"
                  style={{ color: "#3A3A3A" }}
                />
                <div className="flex flex-col">
                  <p className="text-[12px] font-bold">Free Shipping</p>
                  <p className="text-[12px] ">On orders over $200</p>
                </div>
              </div>
              <div className="flex gap-4">
                <SafetyOutlined
                  className="text-[28px]"
                  style={{ color: "#3A3A3A" }}
                />

                <div className="flex flex-col">
                  <p className="text-[12px] font-bold">Secure Packaging</p>
                  <p className="text-[12px] ">Art safely packed & insured</p>
                </div>
              </div>
            </div>
            <div className="p-8 flex flex-col gap-4 justify-between border-1 border-gray-300/60 rounded-2xl text-center">
              <p className="text-gray-600">
                "Each piece is carefully created with love and attention to
                botanical detail."
              </p>
              <p className="font-medium">— Elena, Botanical Artist</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default shoppingcart;
