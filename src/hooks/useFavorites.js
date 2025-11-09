// hooks/useFavorites.js
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const FAVORITES_COOKIE_KEY = "favorites";

export const useFavorites = () => {
  const [favorites, setFavorites] = useState({ items: [] });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const favoritesCookie = Cookies.get(FAVORITES_COOKIE_KEY);
    if (favoritesCookie) {
      try {
        setFavorites(JSON.parse(favoritesCookie));
      } catch (e) {
        setFavorites({ items: [] });
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      Cookies.set(FAVORITES_COOKIE_KEY, JSON.stringify(favorites), {
        expires: 365,
      });
    }
  }, [favorites, isLoaded]);

  // In hooks/useFavorites.js
  const toggleFavorite = (product) => {
    // Always re-fetch cookie before editing
    let cookieFavorites = Cookies.get(FAVORITES_COOKIE_KEY);
    let currentFavorites;
    try {
      currentFavorites = cookieFavorites
        ? JSON.parse(cookieFavorites)
        : { items: [] };
    } catch {
      currentFavorites = { items: [] };
    }

    const exists = currentFavorites.items.some(
      (item) => item.productId === product.product_id
    );
    let newItems;
    if (exists) {
      newItems = currentFavorites.items.filter(
        (item) => item.productId !== product.product_id
      );
    } else {
      newItems = [
        ...currentFavorites.items,
        {
          productId: product.product_id,
          name: product.name,
          price: product.price,
          image: product.images?.[0]?.url || "",
          slug: product.slug,
        },
      ];
    }
    const updatedFavorites = { items: newItems };
    // Update cookie immediately!
    Cookies.set(FAVORITES_COOKIE_KEY, JSON.stringify(updatedFavorites), {
      expires: 365,
    });
    // Sync local state for UI
    setFavorites(updatedFavorites);
  };

  const isFavorite = (productId) => {
    return favorites.items.some((item) => item.productId === productId);
  };

  return { favorites, toggleFavorite, isFavorite, isLoaded };
};
