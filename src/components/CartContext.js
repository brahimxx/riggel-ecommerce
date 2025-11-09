"use client";
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

  // Action methods (copy-paste your safe logic here)
  const addToCart = (product, variant, quantity = 1) => {
    setCart((prevCart) => {
      // Always normalize variantId to null (never undefined)
      const normalizedVariantId =
        typeof variant?.variant_id === "undefined" ? null : variant?.variant_id;

      // Try to find existing item using loose equality (string/number)
      const existingItemIndex = prevCart.items.findIndex(
        (item) =>
          item.productId == product.product_id &&
          item.variantId == normalizedVariantId
      );

      // Defensive: Remove any accidental duplicate first
      let newItems = prevCart.items.filter(
        (item, idx) => idx !== existingItemIndex // skip the old instance if it exists
      );

      if (existingItemIndex > -1) {
        // Add updated item with increased quantity
        const existingItem = prevCart.items[existingItemIndex];
        newItems.push({
          ...existingItem,
          quantity: existingItem.quantity + quantity,
        });
      } else {
        // Add new item
        newItems.push({
          productId: product.product_id,
          variantId: normalizedVariantId,
          name: product.name,
          price: variant?.price || product.price,
          quantity,
          image: product.images?.[0]?.url || "",
          slug: product.slug,
          attributes: variant?.attributes || [],
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

  return (
    <CartContext.Provider
      value={{ cart, addToCart, updateQuantity, removeFromCart, isLoaded }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCartContext = () => useContext(CartContext);
