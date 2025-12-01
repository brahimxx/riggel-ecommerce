"use client";
import { getSalePrice } from "@/lib/api";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import Cookies from "js-cookie";

const CART_COOKIE_KEY = "cart";
const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [] });
  const [isLoaded, setIsLoaded] = useState(false);

  const checkStockAvailability = async (productId, variantId) => {
    try {
      // FIXED: Remove ?variant= param - your API includes all variants
      const res = await fetch(`/api/products/by-id/${productId}`);
      if (!res.ok) return 999;

      const product = await res.json();

      // Your API returns variants array with quantity
      if (variantId) {
        const variant = product.variants?.find(
          (v) => v.variant_id == variantId
        );
        return variant?.quantity || 999;
      }

      // No variant = use first variant or product default
      return product.variants?.[0]?.quantity || 999;
    } catch (error) {
      console.error("Stock check failed:", error);
      return 999; // Graceful fallback
    }
  };

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

  // Sync from other tabs via storage event (works if any tab uses localStorage too)
  // + poll cookies every 500ms as fallback since cookies have no native events
  const syncCart = useCallback(() => {
    const cartCookie = Cookies.get(CART_COOKIE_KEY);
    if (cartCookie) {
      try {
        const parsedCart = JSON.parse(cartCookie);
        if (JSON.stringify(parsedCart) !== JSON.stringify(cart)) {
          setCart(parsedCart);
        }
      } catch {
        // ignore invalid JSON
      }
    }
  }, []);

  useEffect(() => {
    // Listen for localStorage changes (if other tabs use it)
    const handleStorage = (e) => {
      if (e.key === CART_COOKIE_KEY) syncCart();
    };
    window.addEventListener("storage", handleStorage);

    // Poll cookies as backup (cookies don't emit events)
    const interval = setInterval(syncCart, 500);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [syncCart]);

  // Save to cookie whenever cart changes
  useEffect(() => {
    if (isLoaded) {
      Cookies.set(CART_COOKIE_KEY, JSON.stringify(cart), { expires: 7 });
    }
  }, [cart, isLoaded]);

  // Action methods
  const addToCart = async (product, variant, quantity = 1) => {
    const available = await checkStockAvailability(
      product.product_id,
      variant?.variant_id
    );
    if (quantity > available) {
      alert(`Only ${available} available`);
      return;
    }
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
          variant: variant || existingItem.variant || null,
          attributes: variant?.attributes || existingItem.attributes || [],
          price: finalPrice, // optional: keep price in sync with new variant/sale
          quantity: existingItem.quantity + quantity,
        });
      } else {
        newItems.push({
          productId: product.product_id,
          variantId: normalizedVariantId,
          variant: variant || null,
          name: product.name,
          price: finalPrice,
          quantity,
          image: product.images?.[0]?.url || "",
          slug: product.slug,
          attributes: variant?.attributes || [],
          sale: product.sale || null,
        });
      }

      console.log("New cart items:", newItems);

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
        checkStockAvailability,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCartContext = () => useContext(CartContext);
