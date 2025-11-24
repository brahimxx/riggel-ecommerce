"use client";
import { useEffect, useState } from "react";
import CartProductCard from "@/components/CartProductCard";

const ConfirmMark = () => (
  <div className="flex justify-center items-center mb-4">
    <span className="inline-block bg-[#b9d886] rounded-full p-3">
      <svg
        width={40}
        height={40}
        viewBox="0 0 48 48"
        fill="none"
        stroke="#669900"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="24" cy="24" r="22" fill="#e7f3ce" />
        <path d="M15 25l7 7 12-14" />
      </svg>
    </span>
  </div>
);

const ThankYou = () => {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("orderSuccess");
      if (stored) {
        setOrder(JSON.parse(stored));
        localStorage.removeItem("orderSuccess");
      }
    }
  }, []);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Order not found.</p>
      </div>
    );
  }

  const {
    order_id,
    total_amount,
    cart_items = [],
    shipping_cost = 0,
    discount = 0,
  } = order;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#d7e3be]">
      <div className="bg-white rounded-2xl max-w-2xl w-full py-12 px-7 flex flex-col items-center shadow-lg">
        <ConfirmMark />
        <div className="text-4xl mb-2 text-center font-bold">
          Votre commande est confirmée
        </div>
        <div className="text-gray-600 text-lg mb-1 text-center">
          Nous vous enverrons une confirmation d'expédition dès que votre
          commande sera expédiée.
        </div>
        <hr className="w-[60%] my-4" />
        <div className="font-semibold mb-7 text-center">
          Numéro de commande{" "}
          <span className="font-bold">#{order_id || "..."}</span>
        </div>
        <div className="w-full bg-[#f3f8e7] rounded-xl p-6">
          <div className="font-bold text-lg mb-4">Résumé de la commande</div>
          {/* Use cart_items for displaying products */}
          {cart_items.map((item, idx) => (
            <CartProductCard
              key={idx}
              product={item}
              onUpdateQuantity={() => {}}
              onRemove={() => {}}
            />
          ))}
          <hr className="my-3" />
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>
                DZD
                {cart_items
                  .reduce(
                    (sum, item) => sum + Number(item.price) * item.quantity,
                    0
                  )
                  .toFixed(2)
                  .replace(".", ",")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Livraison</span>
              <span>DZD{shipping_cost}</span>
            </div>
            <div className="flex justify-between">
              <span>Remise</span>
              <span>DZD{discount},00</span>
            </div>
            <div className="flex justify-between font-bold mt-4">
              <span>TOTAL</span>
              <span>
                DZD{Number(total_amount).toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
