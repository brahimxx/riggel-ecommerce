"use client";
import AntdClientPatch from "@/components/AntdClientPatch";
import { HeartOutlined, HeartFilled } from "@ant-design/icons";
import { useFavorites } from "@/hooks/useFavorites";
import { message } from "antd";
import { useState, useEffect } from "react";

const FavoriteButton = ({ product, className = "!text-2xl" }) => {
  const { toggleFavorite, isFavorite, isLoaded } = useFavorites();
  const [animate, setAnimate] = useState(false);
  const [pulse, setPulse] = useState(false);

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
      message.success("Removed from favorites!");
    } else {
      toggleFavorite(product);
      message.success("Added to favorites!");
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
      <style jsx>{`
        .animate-pop {
          animation: popFade 0.4s cubic-bezier(0.42, 0, 0.58, 1);
        }
        @keyframes popFade {
          0% {
            transform: scale(1) rotate(0deg);
            opacity: 0.6;
            filter: drop-shadow(0 0 0 #e11d48);
          }
          40% {
            transform: scale(1.4) rotate(-10deg);
            opacity: 1;
            filter: drop-shadow(0 0 8px #e11d48);
          }
          70% {
            transform: scale(1.15) rotate(7deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
            filter: none;
          }
        }
        .animate-pulse {
          animation: pulseHeart 0.5s cubic-bezier(0.42, 0, 0.58, 1);
        }
        @keyframes pulseHeart {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.25);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </AntdClientPatch>
  );
};

export default FavoriteButton;
