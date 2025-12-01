"use client";
import {
  ShoppingCartOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { Badge } from "antd";
import { useCartContext } from "@/components/CartContext";
import { Popover } from "antd";
import CartProductCard from "@/components/CartProductCard";
import { useState, useEffect, useRef } from "react";

const CartIcon = ({ className = "!text-2xl" }) => {
  const { cart, updateQuantity, removeFromCart, checkStockAvailability } =
    useCartContext();

  const [stockStatus, setStockStatus] = useState({});
  const [stockErrors, setStockErrors] = useState({});
  const checkAllStockRef = useRef();

  const subtotal = cart.items
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  // Stock checking for popover (same logic, simplified)
  const checkAllStock = async () => {
    const newStatus = {};
    const newErrors = {};

    for (const item of cart.items) {
      const key = `${item.productId}-${item.variantId || "none"}`;
      const available = await checkStockAvailability(
        item.productId,
        item.variantId
      );
      newStatus[key] = available;

      if (item.quantity > available) {
        newErrors[key] = `Only ${available} available`;
      }
    }

    setStockStatus(newStatus);
    setStockErrors(newErrors);
  };

  // Debounced stock check (runs every 5s, less aggressive for popover)
  useEffect(() => {
    if (cart.items.length === 0) return;

    checkAllStock(); // Immediate check

    if (checkAllStockRef.current) {
      clearTimeout(checkAllStockRef.current);
    }

    checkAllStockRef.current = setTimeout(checkAllStock, 5000);

    return () => {
      if (checkAllStockRef.current) clearTimeout(checkAllStockRef.current);
    };
  }, [cart.items.length]);

  const handleUpdateQuantity = (productId, variantId, newQuantity) => {
    updateQuantity(productId, variantId, newQuantity);

    // Clear stock error immediately
    const key = `${productId}-${variantId || "none"}`;
    setStockErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  };

  const getStockForItem = (item) => {
    const key = `${item.productId}-${item.variantId || "none"}`;
    return stockStatus[key] || 999;
  };

  const title = (
    <>
      <ShoppingOutlined /> Shopping Cart ({totalItems} items)
    </>
  );

  const content = (
    <div
      className="flex flex-col min-w-[300px] max-h-[60vh] overflow-auto"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-4">
        <div className="flex flex-col w-full">
          {cart.items.length > 0 ? (
            <>
              {cart.items.map((item, index) => (
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
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={removeFromCart}
                    maxStock={getStockForItem(item)}
                    stockError={
                      stockErrors[
                        `${item.productId}-${item.variantId || "none"}`
                      ]
                    }
                    compact // Compact mode for popover
                  />
                </div>
              ))}
              <div className="py-2 px-4 bg-white sticky bottom-0 left-0 z-10">
                <div className="flex justify-between items-center font-bold mb-4">
                  <span>Subtotal:</span>
                  <span className="text-xl">${subtotal}</span>
                </div>
                <Link href="/shoppingcart">
                  <button className="w-full hover:bg-black/90 bg-black text-white rounded-full py-2 text-lg font-medium transition cursor-pointer">
                    <CreditCardOutlined className="mr-3" /> Proceed to Checkout
                  </button>
                </Link>
              </div>
            </>
          ) : (
            <p className="py-8 text-center">Your shopping cart is empty.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block z-50">
        <Popover
          placement="bottomRight"
          title={title}
          content={content}
          trigger="hover"
          fresh={true}
        >
          <Badge count={totalItems} size="small" offset={[3, -2]} color="red">
            <ShoppingCartOutlined
              className={`cursor-pointer ${className}`}
              style={{ fontSize: "1.8em" }}
            />
          </Badge>
        </Popover>
      </div>
      <div className="lg:hidden">
        <Badge count={totalItems} size="small" offset={[3, -2]} color="red">
          <ShoppingCartOutlined className={`cursor-pointer ${className}`} />
        </Badge>
      </div>
    </>
  );
};

export default CartIcon;
