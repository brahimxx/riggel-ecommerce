"use client";
import {
  ArrowLeftOutlined,
  ShoppingOutlined,
  PercentageOutlined,
  CreditCardOutlined,
  TruckOutlined,
  SafetyOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useCartContext } from "@/components/CartContext";
import { getSalePrice } from "@/lib/api";
import { useRouter } from "next/navigation";
import CartProductCard from "@/components/CartProductCard";
import { useState, useEffect, useRef } from "react";

const wilayaOptions = [
  { value: "DZ-01", label: "01 - Adrar - أدرار" },
  { value: "DZ-02", label: "02 - Chlef - الشلف" },
  { value: "DZ-03", label: "03 - Laghouat - الأغواط" },
  { value: "DZ-04", label: "04 - Oum El Bouaghi - أم البواقي" },
  { value: "DZ-05", label: "05 - Batna - باتنة" },
  { value: "DZ-06", label: "06 - Béjaïa - بجاية" },
  { value: "DZ-07", label: "07 - Biskra - بسكرة" },
  { value: "DZ-08", label: "08 - Béchar - بشار" },
  { value: "DZ-09", label: "09 - Blida - البليدة" },
  { value: "DZ-10", label: "10 - Bouira - البويرة" },
  { value: "DZ-11", label: "11 - Tamanrasset - تمنراست" },
  { value: "DZ-12", label: "12 - Tébessa - تبسة" },
  { value: "DZ-13", label: "13 - Tlemcen - تلمسان" },
  { value: "DZ-14", label: "14 - Tiaret - تيارت" },
  { value: "DZ-15", label: "15 - Tizi Ouzou - تيزي وزو" },
  { value: "DZ-16", label: "16 - Alger - الجزائر" },
  { value: "DZ-17", label: "17 - Djelfa - الجلفة" },
  { value: "DZ-18", label: "18 - Jijel - جيجل" },
  { value: "DZ-19", label: "19 - Sétif - سطيف" },
  { value: "DZ-20", label: "20 - Saïda - سعيدة" },
  { value: "DZ-21", label: "21 - Skikda - سكيكدة" },
  { value: "DZ-22", label: "22 - Sidi Bel Abbès - سيدي بلعباس" },
  { value: "DZ-23", label: "23 - Annaba - عنابة" },
  { value: "DZ-24", label: "24 - Guelma - قالمة" },
  { value: "DZ-25", label: "25 - Constantine - قسنطينة" },
  { value: "DZ-26", label: "26 - Médea - المدية" },
  { value: "DZ-27", label: "27 - Mostaganem - مستغانم" },
  { value: "DZ-28", label: "28 - M'Sila - مسيلة" },
  { value: "DZ-29", label: "29 - Mascara - معسكر" },
  { value: "DZ-30", label: "30 - Ouargla - ورقلة" },
  { value: "DZ-31", label: "31 - Oran - وهران" },
  { value: "DZ-32", label: "32 - El Bayadh - البيض" },
  { value: "DZ-33", label: "33 - Illizi - إليزي" },
  { value: "DZ-34", label: "34 - Bordj Bou Arreridj - برج بوعريريج" },
  { value: "DZ-35", label: "35 - Boumerdès - بومرداس" },
  { value: "DZ-36", label: "36 - El Tarf - الطارف" },
  { value: "DZ-37", label: "37 - Tindouf - تندوف" },
  { value: "DZ-38", label: "38 - Tissemsilt - تيسمسيلت" },
  { value: "DZ-39", label: "39 - El Oued - الوادي" },
  { value: "DZ-40", label: "40 - Khenchela - خنشلة" },
  { value: "DZ-41", label: "41 - Souk Ahras - سوق أهراس" },
  { value: "DZ-42", label: "42 - Tipaza - تيبازة" },
  { value: "DZ-43", label: "43 - Mila - ميلة" },
  { value: "DZ-44", label: "44 - Aïn Defla - عين الدفلى" },
  { value: "DZ-45", label: "45 - Naâma - النعامة" },
  { value: "DZ-46", label: "46 - Aïn Témouchent - عين تموشنت" },
  { value: "DZ-47", label: "47 - Ghardaïa - غرداية" },
  { value: "DZ-48", label: "48 - Relizane - غليزان" },
  { value: "DZ-49", label: "49 - Timimoun - تيميمون" },
  { value: "DZ-50", label: "50 - Bordj Badji Mokhtar - برج باجي مختار" },
  { value: "DZ-51", label: "51 - Ouled Djellal - أولاد جلال" },
  { value: "DZ-52", label: "52 - Béni Abbès - بني عباس" },
  { value: "DZ-53", label: "53 - In Salah - عين صالح" },
  { value: "DZ-54", label: "54 - In Guezzam - عين قزام" },
  { value: "DZ-55", label: "55 - Touggourt - تقرت" },
  { value: "DZ-56", label: "56 - Djanet - جانت" },
  { value: "DZ-57", label: "57 - El M'Ghair - المغير" },
  { value: "DZ-58", label: "58 - El Menia - المنيعة" },
  { value: "DZ-59", label: "59 - Aflou - أفلو" },
  { value: "DZ-60", label: "60 - Barika - بريكة" },
  { value: "DZ-61", label: "61 - Ksar Chellala - قصر الشلال" },
  { value: "DZ-62", label: "62 - Messaad - المسعد" },
  { value: "DZ-63", label: "63 - Aïn Oussera - عين وسارة" },
  { value: "DZ-64", label: "64 - Boussaâda - بوسعادة" },
  { value: "DZ-65", label: "65 - El Abiodh Sidi Cheikh - الأبيض سيدي الشيخ" },
  { value: "DZ-66", label: "66 - El Kantara - القنطرة" },
  { value: "DZ-67", label: "67 - Bir El Ater - بئر العاتر" },
  { value: "DZ-68", label: "68 - Ksar El Boukhari - قصر البخاري" },
  { value: "DZ-69", label: "69 - El Aricha - العريشة" },
];

const ShoppingCartClient = () => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkStockAvailability,
  } = useCartContext();
  const router = useRouter();

  const clearedWarningsRef = useRef(new Set());

  const handleUpdateQuantity = (productId, variantId, newQuantity) => {
    updateQuantity(productId, variantId, newQuantity);

    const key = `${productId}-${variantId || "none"}`;
    clearedWarningsRef.current.add(key);

    setStockErrors((prevErrors) => {
      if (!prevErrors[key]) return prevErrors;
      const newErrors = { ...prevErrors };
      delete newErrors[key];
      return newErrors;
    });

    // Remove the key from cleared set after debounce delay
    setTimeout(() => {
      clearedWarningsRef.current.delete(key);
    }, 3500);
  };

  const [stockStatus, setStockStatus] = useState({}); // {productId-variantId: availableStock}
  const [stockErrors, setStockErrors] = useState({}); // per-item warnings
  const checkAllStockRef = useRef(); // Debounce ref

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  // Form state variables for customer details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [town, setTown] = useState("");
  const [note, setNote] = useState("");

  const subtotal = cart.items
    .reduce((sum, item) => {
      const priceNow = getSalePrice(item, item.price);
      return sum + priceNow * item.quantity;
    }, 0)
    .toFixed(2);

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const tax = (subtotal * 0.011).toFixed(2);
  const shippingCost = subtotal >= 200 ? 0 : 15;
  const totalAmount = (Number(subtotal) + Number(tax) + shippingCost).toFixed(
    2
  );

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

      if (item.quantity > available && !clearedWarningsRef.current.has(key)) {
        newErrors[
          key
        ] = `Only ${available} available (you have ${item.quantity})`;
      }
    }

    setStockStatus(newStatus);
    setStockErrors(newErrors);
  };

  useEffect(() => {
    if (cart.items.length === 0) return;

    // IMMEDIATE check on mount + cart changes
    checkAllStock();

    // Debounced refresh every 3s
    if (checkAllStockRef.current) {
      clearTimeout(checkAllStockRef.current);
    }

    checkAllStockRef.current = setTimeout(checkAllStock, 3000);

    return () => {
      if (checkAllStockRef.current) clearTimeout(checkAllStockRef.current);
    };
  }, [cart.items.length]); // Keep simple deps

  // Pass stock info to CartProductCard
  const getStockForItem = (item) => {
    const key = `${item.productId}-${item.variantId || "none"}`;
    return stockStatus[key] || 999;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!phone.trim() || !/^\d{7,15}$/.test(phone.trim()))
      newErrors.phone = "Valid phone number is required";
    if (!wilaya) newErrors.wilaya = "Wilaya is required";
    if (!town.trim()) newErrors.town = "Town is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    // ✅ CRITICAL: Final stock validation before order
    try {
      const stockIssues = [];

      for (const item of cart.items) {
        const available = await checkStockAvailability(
          item.productId,
          item.variantId
        );
        if (item.quantity > available) {
          stockIssues.push(
            `${item.name}: Only ${available} available (you have ${item.quantity})`
          );
        }
      }

      if (stockIssues.length > 0) {
        setError(`Stock changed:\n• ${stockIssues.join("\n• ")}`);
        setLoading(false);
        return;
      }
    } catch (err) {
      setError("Stock check failed. Please try again.");
      setLoading(false);
      return;
    }

    const shippingAddress = `${wilaya} - ${town}`;
    const order_items = cart.items.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
      price: Number(getSalePrice(item, item.price)),
    }));

    const orderData = {
      client_name: name,
      phone,
      shipping_address: shippingAddress,
      order_date: new Date().toISOString(),
      status: "pending",
      email,
      total_amount: Number(
        (subtotal * 1.011 + (subtotal >= 200 ? 0 : 15)).toFixed(2)
      ),
      order_items,
      note,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Order submission failed");
      }

      const result = await res.json();
      clearCart();
      router.push(`/thankyou?token=${result.order_token}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative flex flex-col items-start justify-start lg:h-full max-w-screen-2xl mx-auto px-4 gap-6 mb-20 ">
        <button
          onClick={() => router.back()}
          className="font-semibold text-black hover:text-white hover:bg-black cursor-pointer w-full lg:w-[180px] rounded-full text-sm py-[10px] text-center flex items-center justify-center gap-2"
        >
          <ArrowLeftOutlined /> Continue Shopping
        </button>

        <div className="flex flex-col lg:flex-row w-full justify-between ">
          <div className="flex flex-col lg:w-[60%] gap-6  ">
            <div className="p-4 border-1 border-gray-300/60 rounded-2xl">
              <div>
                <ShoppingOutlined /> Shopping Cart ({totalItems} items)
              </div>

              <div className="flex flex-col w-full">
                {cart.items.length > 0 ? (
                  cart.items.map((item, index) => (
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
                        maxStock={getStockForItem(item)} // ← PASS MAX STOCK
                        stockError={
                          stockErrors[
                            `${item.productId}-${item.variantId || "none"}`
                          ]
                        }
                      />
                    </div>
                  ))
                ) : (
                  <p>Your shopping cart is empty.</p>
                )}
              </div>
            </div>
            <div className="p-4 flex flex-col gap-4 justify-between border-1 border-gray-300/60 rounded-2xl">
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <MessageOutlined style={{ color: "#3A3A3A" }} />
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium "
                  >
                    Add a note to your order (optional)
                  </label>
                </div>

                <textarea
                  id="message"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="block p-2.5 w-full h-[63px] text-sm bg-gray-50 rounded-lg border border-gray-300 focus:outline-black"
                  placeholder="Any special requests, gift messages, or packaging instructions..."
                ></textarea>
              </div>
              <p className="text-[13px] text-gray-600">
                Examples: "Please gift wrap this item", "This is a gift for my
                mother", "Handle with extra care"
              </p>
            </div>
          </div>

          <div className="lg:mb-10 lg:w-[38%] h-screen flex flex-col gap-6  lg:mt-0 lg:sticky right-0 top-[90px]">
            <div className="flex flex-col gap-6 mt-6 lg:gap-3 lg:mt-0">
              <div className="p-4 flex flex-col gap-4 justify-between border-1 border-gray-300/60 rounded-2xl">
                <p>Customer Details</p>
                {errors.name && <p className="text-red-500">{errors.name}</p>}
                <input
                  type="text"
                  id="name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-black"
                />
                {errors.phone && <p className="text-red-500">{errors.phone}</p>}
                <input
                  type="tel"
                  id="phone"
                  placeholder="Your phone number"
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-black"
                />
                {errors.email && <p className="text-red-500">{errors.email}</p>}
                <input
                  type="email"
                  id="email"
                  value={email}
                  placeholder="Your email address"
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-black"
                />
                {errors.wilaya && (
                  <p className="text-red-500">{errors.wilaya}</p>
                )}
                <select
                  id="wilaya"
                  className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-black"
                  onChange={(e) => setWilaya(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Wilaya
                  </option>
                  {wilayaOptions.map((wilaya) => (
                    <option key={wilaya.value} value={wilaya.value}>
                      {wilaya.label}
                    </option>
                  ))}
                </select>
                {errors.town && <p className="text-red-500">{errors.town}</p>}
                <input
                  type="text"
                  id="town"
                  placeholder="Your town"
                  onChange={(e) => setTown(e.target.value)}
                  className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-black"
                />
              </div>
              <div className="p-4 flex flex-col gap-4 justify-between border-1  border-gray-300/60 rounded-2xl">
                <p>Order Summary</p>
                <div className="flex flex-col pb-4 border-b-1 border-gray-300/60 gap-4">
                  <div className="flex justify-between">
                    <p>Subtotal ({totalItems} items)</p>
                    <p>${subtotal}</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Tax (1.1%)</p>
                    <p>${(subtotal * 0.011).toFixed(2)} </p>
                  </div>
                  <div className="flex justify-between">
                    <p>Shipping</p>
                    <p>{subtotal >= 200 ? "Free" : "$15.00"}</p>
                  </div>
                </div>
                <div className="flex justify-between text-[18px] font-bold">
                  <p>Total</p>
                  <p>
                    ${(subtotal * 0.011 + Number(subtotal) + 15).toFixed(2)}
                  </p>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || cart.items.length === 0}
                  className="bg-black hover:bg-black/90 text-white rounded-full  py-2 text-md lg:text-lg font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCardOutlined className="mr-3" />
                  {loading ? "Placing Order..." : "Proceed to Checkout"}
                </button>

                <div className="flex gap-4">
                  <div className="relative flex-grow">
                    <PercentageOutlined className="absolute left-3 top-[19px] -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      id="search-navbar"
                      className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-black  "
                      placeholder={"Promo Code"}
                    />
                  </div>
                  <button className="bg-black hover:bg-black/90 text-white rounded-full py-2 font-medium transition cursor-pointer  w-[150px] text-md lg:text-lg">
                    Apply
                  </button>
                </div>
              </div>
              <div className="p-4 flex lg:hidden flex-col gap-4  justify-between border-1 border-gray-300/60 rounded-2xl">
                <div className="flex gap-4">
                  <TruckOutlined
                    className="text-[28px]"
                    style={{ color: "#3A3A3A" }}
                  />
                  <div className="flex flex-col">
                    <p className="text-[12px] font-bold">Free Shipping</p>
                    <p className="text-[12px] ">On orders over $200</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <SafetyOutlined
                    className="text-[28px]"
                    style={{ color: "#3A3A3A" }}
                  />

                  <div className="flex flex-col">
                    <p className="text-[12px] font-bold">Secure Packaging</p>
                    <p className="text-[12px] ">Art safely packed & insured</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShoppingCartClient;
