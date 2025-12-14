import ShoppingCartClient from "@/components/ShoppingCartClient";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata = {
  // Layout template will render this as "Shopping Cart | Riggel"
  title: "Shopping Cart",
  description:
    "Review your selected items, check stock availability, and securely place your order on Riggel.",
  openGraph: {
    title: "Shopping Cart",
    description:
      "Review your selected items, check stock availability, and securely place your order on Riggel.",
    url: `${siteUrl}/cart`,
    siteName: "Riggel",
    locale: "en_US",
    type: "website",
  },
};

export default function ShoppingCart() {
  return <ShoppingCartClient />;
}
