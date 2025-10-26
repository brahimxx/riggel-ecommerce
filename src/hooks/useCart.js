// hooks/useCart.js
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const CART_COOKIE_KEY = "cart";

export const useCart = () => {
  // 1. Initialize state with an empty cart. This will be used for both
  // the server render and the initial client render to avoid a mismatch.
  const [cart, setCart] = useState({ items: [] });
  const [isLoaded, setIsLoaded] = useState(false);

  // 2. Use useEffect to load the cart from cookies ONLY on the client-side.
  useEffect(() => {
    const cartCookie = Cookies.get(CART_COOKIE_KEY);
    if (cartCookie) {
      try {
        setCart(JSON.parse(cartCookie));
      } catch (e) {
        console.error("Error parsing cart cookie:", e);
        setCart({ items: [] });
      }
    }
    // Mark the cart as loaded from the client-side
    setIsLoaded(true);
  }, []); // The empty dependency array ensures this runs only once on mount.

  // 3. Use a separate useEffect to SAVE the cart to cookies whenever it changes.
  // This should only run after the initial client-side load is complete.
  useEffect(() => {
    // Don't save the initial empty state to the cookie on the first render.
    if (isLoaded) {
      Cookies.set(CART_COOKIE_KEY, JSON.stringify(cart), { expires: 7 });
    }
  }, [cart, isLoaded]);

  const addToCart = (product, variant, quantity = 1) => {
    const newItem = {
      productId: product.product_id,
      variantId: variant ? variant.variant_id : null,
      name: product.name,
      price: variant?.price || product.price,
      quantity: quantity,
      image: product.images?.[0]?.url || "",
      slug: product.slug,
      attributes: variant?.attributes || [],
    };

    setCart((prevCart) => {
      const existingItemIndex = prevCart.items.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.variantId === newItem.variantId
      );

      const newItems = [...prevCart.items];

      if (existingItemIndex > -1) {
        newItems[existingItemIndex].quantity += newItem.quantity;
      } else {
        newItems.push(newItem);
      }

      return { items: newItems };
    });
  };

  const updateQuantity = (productId, variantId, newQuantity) => {
    setCart((prevCart) => {
      // Ensure quantity is at least 1
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

  return { cart, addToCart, updateQuantity, removeFromCart };
};
