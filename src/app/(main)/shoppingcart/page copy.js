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

const wilayaOptions = [
  { value: "DZ-01", label: "01 - Adrar - [translate:أدرار]" },
  { value: "DZ-02", label: "02 - Chlef - [translate:الشلف]" },
  { value: "DZ-03", label: "03 - Laghouat - [translate:الأغواط]" },
  { value: "DZ-04", label: "04 - Oum El Bouaghi - [translate:أم البواقي]" },
  { value: "DZ-05", label: "05 - Batna - [translate:باتنة]" },
  { value: "DZ-06", label: "06 - Béjaïa - [translate:بجاية]" },
  { value: "DZ-07", label: "07 - Biskra - [translate:بسكرة]" },
  { value: "DZ-08", label: "08 - Béchar - [translate:بشار]" },
  { value: "DZ-09", label: "09 - Blida - [translate:البليدة]" },
  { value: "DZ-10", label: "10 - Bouira - [translate:البويرة]" },
  { value: "DZ-11", label: "11 - Tamanrasset - [translate:تمنراست]" },
  { value: "DZ-12", label: "12 - Tébessa - [translate:تبسة]" },
  { value: "DZ-13", label: "13 - Tlemcen - [translate:تلمسان]" },
  { value: "DZ-14", label: "14 - Tiaret - [translate:تيارت]" },
  { value: "DZ-15", label: "15 - Tizi Ouzou - [translate:تيزي وزو]" },
  { value: "DZ-16", label: "16 - Alger - [translate:الجزائر]" },
  { value: "DZ-17", label: "17 - Djelfa - [translate:الجلفة]" },
  { value: "DZ-18", label: "18 - Jijel - [translate:جيجل]" },
  { value: "DZ-19", label: "19 - Sétif - [translate:سطيف]" },
  { value: "DZ-20", label: "20 - Saïda - [translate:سعيدة]" },
  { value: "DZ-21", label: "21 - Skikda - [translate:سكيكدة]" },
  { value: "DZ-22", label: "22 - Sidi Bel Abbès - [translate:سيدي بلعباس]" },
  { value: "DZ-23", label: "23 - Annaba - [translate:عنابة]" },
  { value: "DZ-24", label: "24 - Guelma - [translate:قالمة]" },
  { value: "DZ-25", label: "25 - Constantine - [translate:قسنطينة]" },
  { value: "DZ-26", label: "26 - Médea - [translate:المدية]" },
  { value: "DZ-27", label: "27 - Mostaganem - [translate:مستغانم]" },
  { value: "DZ-28", label: "28 - M'Sila - [translate:مسيلة]" },
  { value: "DZ-29", label: "29 - Mascara - [translate:معسكر]" },
  { value: "DZ-30", label: "30 - Ouargla - [translate:ورقلة]" },
  { value: "DZ-31", label: "31 - Oran - [translate:وهران]" },
  { value: "DZ-32", label: "32 - El Bayadh - [translate:البيض]" },
  { value: "DZ-33", label: "33 - Illizi - [translate:إليزي]" },
  {
    value: "DZ-34",
    label: "34 - Bordj Bou Arreridj - [translate:برج بوعريريج]",
  },
  { value: "DZ-35", label: "35 - Boumerdès - [translate:بومرداس]" },
  { value: "DZ-36", label: "36 - El Tarf - [translate:الطارف]" },
  { value: "DZ-37", label: "37 - Tindouf - [translate:تندوف]" },
  { value: "DZ-38", label: "38 - Tissemsilt - [translate:تيسمسيلت]" },
  { value: "DZ-39", label: "39 - El Oued - [translate:الوادي]" },
  { value: "DZ-40", label: "40 - Khenchela - [translate:خنشلة]" },
  { value: "DZ-41", label: "41 - Souk Ahras - [translate:سوق أهراس]" },
  { value: "DZ-42", label: "42 - Tipaza - [translate:تيبازة]" },
  { value: "DZ-43", label: "43 - Mila - [translate:ميلة]" },
  { value: "DZ-44", label: "44 - Aïn Defla - [translate:عين الدفلى]" },
  { value: "DZ-45", label: "45 - Naâma - [translate:النعامة]" },
  { value: "DZ-46", label: "46 - Aïn Témouchent - [translate:عين تموشنت]" },
  { value: "DZ-47", label: "47 - Ghardaïa - [translate:غرداية]" },
  { value: "DZ-48", label: "48 - Relizane - [translate:غليزان]" },
  { value: "DZ-49", label: "49 - Timimoun - [translate:تيميمون]" },
  {
    value: "DZ-50",
    label: "50 - Bordj Badji Mokhtar - [translate:برج باجي مختار]",
  },
  { value: "DZ-51", label: "51 - Ouled Djellal - [translate:أولاد جلال]" },
  { value: "DZ-52", label: "52 - Béni Abbès - [translate:بني عباس]" },
  { value: "DZ-53", label: "53 - In Salah - [translate:عين صالح]" },
  { value: "DZ-54", label: "54 - In Guezzam - [translate:عين قزام]" },
  { value: "DZ-55", label: "55 - Touggourt - [translate:تقرت]" },
  { value: "DZ-56", label: "56 - Djanet - [translate:جانت]" },
  { value: "DZ-57", label: "57 - El M'Ghair - [translate:المغير]" },
  { value: "DZ-58", label: "58 - El Menia - [translate:المنيعة]" },
  { value: "DZ-59", label: "59 - Aflou - [translate:أفلو]" },
  { value: "DZ-60", label: "60 - Barika - [translate:بريكة]" },
  { value: "DZ-61", label: "61 - Ksar Chellala - [translate:قصر الشلال]" },
  { value: "DZ-62", label: "62 - Messaad - [translate:المسعد]" },
  { value: "DZ-63", label: "63 - Aïn Oussera - [translate:عين وسارة]" },
  { value: "DZ-64", label: "64 - Boussaâda - [translate:بوسعادة]" },
  {
    value: "DZ-65",
    label: "65 - El Abiodh Sidi Cheikh - [translate:الأبيض سيدي الشيخ]",
  },
  { value: "DZ-66", label: "66 - El Kantara - [translate:القنطرة]" },
  { value: "DZ-67", label: "67 - Bir El Ater - [translate:بئر العاتر]" },
  { value: "DZ-68", label: "68 - Ksar El Boukhari - [translate:قصر البخاري]" },
  { value: "DZ-69", label: "69 - El Aricha - [translate:العريشة]" },
];

const shoppingcart = () => {
  const { cart, updateQuantity, removeFromCart } = useCartContext();
  const router = useRouter();

  const subtotal = cart.items
    .reduce((sum, item) => {
      // Always run getSalePrice to ensure up-to-date price
      const priceNow = getSalePrice(item, item.price);
      return sum + priceNow * item.quantity;
    }, 0)
    .toFixed(2);
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <div className="relative flex flex-col items-start justify-start lg:h-full max-w-screen-2xl mx-auto px-4 gap-6 mb-20">
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
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeFromCart}
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
                <div className="flex items-center gap-2 mb-2">
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
                  rows="4"
                  className="block p-2.5 w-full h-[63px] text-sm  bg-gray-50 rounded-lg border border-gray-300 focus:outline-black  "
                  placeholder="Any special requests, gift messages, or packaging instructions..."
                ></textarea>
              </div>
              <p className="text-[13px] text-gray-600">
                Examples: "Please gift wrap this item", "This is a gift for my
                mother", "Handle with extra care"
              </p>
            </div>
          </div>

          <div className="lg:w-[38%] h-screen flex flex-col gap-6  lg:mt-0 lg:sticky right-0 top-[90px]">
            <div className="flex flex-col gap-6 mt-6 lg:gap-3 lg:mt-0">
              <div className="p-4 flex flex-col gap-4 justify-between border-1 border-gray-300/60 rounded-2xl">
                <p>Customer Details</p>

                <input
                  type="text"
                  id="name"
                  placeholder="Your full name"
                  className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-black"
                />

                <input
                  type="tel"
                  id="phone"
                  placeholder="Your phone number"
                  className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-black"
                />

                <select
                  id="wilaya"
                  className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-black"
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

                <input
                  type="text"
                  id="town"
                  placeholder="Your town"
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
                <button className="bg-black hover:bg-black/90 text-white rounded-full  py-2 text-md lg:text-lg font-medium transition cursor-pointer  ">
                  <CreditCardOutlined className="mr-3" /> Proceed to Checkout
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
              <div className="p-8 flex lg:hidden flex-col gap-4 justify-between border-1 border-gray-300/60 rounded-2xl text-center">
                <p className="text-gray-600">
                  "Each piece is carefully created with love and attention to
                  botanical detail."
                </p>
                <p className="font-medium">— Elena, Botanical Artist</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default shoppingcart;
