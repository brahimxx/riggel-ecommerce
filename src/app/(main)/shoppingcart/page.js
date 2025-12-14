import ShoppingCartClient from "@/components/ShoppingCartClient";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata = {
  title: "Shopping Cart",
  description:
    "Review your selected items, check stock availability, and securely place your order on Riggel.",
  openGraph: {
    title: "Shopping Cart",
    description:
      "Review your selected items, check stock availability, and securely place your order on Riggel.",
    url: `${siteUrl}/cart`,
    siteName: "Riggel",
    images: [
      {
        url: "/riggel-og-1200x630.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function ShoppingCart() {
  return <ShoppingCartClient />;
}
