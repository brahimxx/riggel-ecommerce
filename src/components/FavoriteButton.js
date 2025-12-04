"use client";
import AntdClientPatch from "@/components/AntdClientPatch";
import { HeartOutlined, HeartFilled } from "@ant-design/icons";
import { useFavorites } from "@/hooks/useFavorites";
import { App } from "antd";
import { useState, useEffect } from "react";

const FavoriteButton = ({ product, className = "!text-2xl" }) => {
  const { toggleFavorite, isFavorite, isLoaded } = useFavorites();
  const [animate, setAnimate] = useState(false);
  const [pulse, setPulse] = useState(false);

  const { message } = App.useApp();
  // Trigger pop animation when favorite toggles
  useEffect(() => {
    if (isLoaded) {
      setAnimate(true);
      const timeout = setTimeout(() => setAnimate(false), 400); // duration matches animation
      return () => clearTimeout(timeout);
    }
  }, [isFavorite(product.product_id), isLoaded]); // re-run when fav changes

  const handleFavorite = (e) => {
    e.preventDefault();
    if (isFavorite(product.product_id)) {
      toggleFavorite(product);
      message?.success("Removed from favorites!");
    } else {
      toggleFavorite(product);
      message?.success("Added to favorites!");
    }
  };

  if (!isLoaded) return null;

  return (
    <AntdClientPatch>
      <span
        className={`transition-all duration-200 block ${
          animate ? "animate-pop" : ""
        } ${pulse ? "animate-pulse" : ""}`}
        onMouseEnter={() => setPulse(true)}
        onMouseLeave={() => setPulse(false)}
      >
        {isFavorite(product.product_id) ? (
          <HeartFilled
            className={`!text-red-500 ${className} cursor-pointer`}
            onClick={handleFavorite}
            style={{ transition: "transform .2s", willChange: "transform" }}
          />
        ) : (
          <HeartOutlined
            className={`!text-red-300 ${className} cursor-pointer`}
            onClick={handleFavorite}
            style={{ transition: "transform .2s", willChange: "transform" }}
          />
        )}
      </span>
    </AntdClientPatch>
  );
};

export default FavoriteButton;
