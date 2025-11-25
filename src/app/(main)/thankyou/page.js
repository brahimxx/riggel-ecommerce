"use client";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

const ConfirmMark = () => (
  <div className="flex justify-center items-center mb-4">
    <span className="inline-block rounded-full p-3">
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

const OrderSummaryCard = ({ product }) => {
  const finalPrice = Number(product.price || 0);
  const quantity = Number(product.quantity || 1);
  const total = (finalPrice * quantity).toFixed(2);

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex h-[80px] sm:h-[90px] gap-3">
        {/* Image Section */}
        <div className="relative shrink-0">
          <div className="relative w-[80px] h-[80px] sm:w-[90px] sm:h-[90px] rounded-xl bg-[#F0EEED] overflow-hidden">
            <Image
              src={product.image || "/placeholder.png"}
              alt={product.name || "Product image"}
              fill
              className="object-contain p-1"
            />
            {/* Quantity Badge */}
            <span className="absolute top-0 right-0 bg-gray-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg z-10">
              x{quantity}
            </span>
          </div>
        </div>

        {/* Details Section */}
        <div className="flex w-full flex-col justify-center">
          <div className="flex justify-between items-start">
            {/* Left: Name & Attributes */}
            <div className="flex flex-col gap-1 pr-2">
              <p className="text-[13px] sm:text-[15px] font-bold text-black line-clamp-2 leading-tight">
                {product.name}
              </p>

              <div className="flex flex-col">
                {product.attributes &&
                  product.attributes.length > 0 &&
                  product.attributes.map((attr, index) => (
                    <p
                      key={index}
                      className="text-[11px] sm:text-[12px] text-gray-500"
                    >
                      {attr.name}: {attr.value}
                    </p>
                  ))}
              </div>
            </div>

            {/* Right: Price */}
            <div className="text-right whitespace-nowrap">
              <p className="text-[13px] sm:text-[15px] font-bold text-black">
                ${total}
              </p>
              {quantity > 1 && (
                <p className="text-[11px] text-gray-500">
                  ${finalPrice.toFixed(2)} each
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ThankYou = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!token) {
        setFetchError("Missing order token.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${token}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch order.");
        }

        const data = await res.json();
        setOrder(data);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [token]);

  const cartItems = useMemo(() => {
    if (!order?.order_items) return [];
    return order.order_items.map((item) => ({
      name: item.product_name || `Item #${item.order_item_id}`,
      price: item.price,
      quantity: item.quantity,
      attributes: item.attributes
        ? item.attributes.split(", ").map((value, idx) => ({
            name: `Option ${idx + 1}`,
            value,
          }))
        : [],
      image: item.product_image || "/placeholder.png",
    }));
  }, [order]);

  const subtotal = useMemo(
    () =>
      cartItems
        .reduce(
          (sum, item) =>
            sum + Number(item.price || 0) * Number(item.quantity || 0),
          0
        )
        .toFixed(2),
    [cartItems]
  );

  const shippingCost = useMemo(
    () => (Number(subtotal) >= 200 ? 0 : 15),
    [subtotal]
  );
  const discount = 0;

  const totalAmount = order
    ? Number(order.total_amount).toFixed(2)
    : (Number(subtotal) * 1.011 + shippingCost).toFixed(2);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="animate-pulse font-semibold text-gray-600">
          Loading...
        </div>
      </div>
    );
  }

  if (!token || fetchError || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <p className="text-gray-600 font-bold text-lg">Order not found.</p>
          {fetchError && (
            <p className="text-red-500 text-sm mt-2">{fetchError}</p>
          )}
          <a href="/" className="text-[#669900] mt-4 inline-block underline">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const { order_id } = order;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="border border-gray-200 rounded-2xl max-w-2xl w-full p-4 mb-10 sm:px-7 flex flex-col items-center shadow-lg">
        <ConfirmMark />
        <div className="text-2xl sm:text-4xl mb-2 text-center font-bold">
          Your order is confirmed
        </div>
        <div className="text-gray-600 text-sm sm:text-lg mb-1 text-center px-4">
          We will send you a shipping confirmation once your order has been
          dispatched.
        </div>
        <hr className="w-[60%] my-4 border-gray-200" />
        <div className="font-semibold mb-7 text-center text-lg">
          Order number{" "}
          <span className="font-bold text-[#669900]">#{order_id || "..."}</span>
        </div>

        <div className="w-full rounded-xl p-4 sm:p-6">
          <div className="font-bold text-lg mb-4 text-gray-800">
            Order Summary
          </div>

          {/* Items */}
          <div className="max-h-[300px] overflow-y-auto pr-1">
            {cartItems.map((item, idx) => (
              <OrderSummaryCard key={idx} product={item} />
            ))}
          </div>

          <hr className="my-4 border-gray-200" />

          {/* Totals */}
          <div className="flex flex-col gap-2 text-sm sm:text-base">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount</span>
                <span>- ${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold mt-4 text-lg text-gray-900 border-t border-gray-300 pt-3">
              <span>TOTAL</span>
              <span>${totalAmount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
