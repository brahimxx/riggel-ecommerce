"use client";
import { getSalePrice } from "@/lib/api";
import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

const CART_COOKIE_KEY = "cart";
const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [] });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from cookie on mount
  useEffect(() => {
    const cartCookie = Cookies.get(CART_COOKIE_KEY);
    if (cartCookie) {
      try {
        setCart(JSON.parse(cartCookie));
      } catch {
        setCart({ items: [] });
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to cookie whenever cart changes
  useEffect(() => {
    if (isLoaded) {
      Cookies.set(CART_COOKIE_KEY, JSON.stringify(cart), { expires: 7 });
    }
  }, [cart, isLoaded]);

  // Action methods
  const addToCart = (product, variant, quantity = 1) => {
    setCart((prevCart) => {
      const normalizedVariantId =
        typeof variant?.variant_id === "undefined" ? null : variant?.variant_id;

      const existingItemIndex = prevCart.items.findIndex(
        (item) =>
          item.productId == product.product_id &&
          item.variantId == normalizedVariantId
      );

      let newItems = prevCart.items.filter(
        (item, idx) => idx !== existingItemIndex
      );

      // Calculate correct price
      const basePrice = variant?.price || product.price;
      const finalPrice = getSalePrice(product, basePrice);

      if (existingItemIndex > -1) {
        const existingItem = prevCart.items[existingItemIndex];
        newItems.push({
          ...existingItem,
          quantity: existingItem.quantity + quantity,
        });
      } else {
        newItems.push({
          productId: product.product_id,
          variantId: normalizedVariantId,
          name: product.name,
          price: finalPrice,
          quantity,
          image: product.images?.[0]?.url || "",
          slug: product.slug,
          attributes: variant?.attributes || [],
          sale: product.sale || null,
        });
      }

      return { items: newItems };
    });
  };

  const updateQuantity = (productId, variantId, newQuantity) => {
    setCart((prevCart) => {
      const validatedQuantity = Math.max(1, newQuantity);
      const newItems = prevCart.items.map((item) => {
        if (item.productId === productId && item.variantId === variantId) {
          return { ...item, quantity: validatedQuantity };
        }
        return item;
      });
      return { items: newItems };
    });
  };

  const removeFromCart = (productId, variantId) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter(
        (item) =>
          !(item.productId === productId && item.variantId === variantId)
      );
      return { items: newItems };
    });
  };

  // New clearCart method
  const clearCart = () => {
    setCart({ items: [] });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCartContext = () => useContext(CartContext);
