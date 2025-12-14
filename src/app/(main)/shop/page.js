import ShopPageClient from "@/components/ShopPageClient";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata = {
  title: "Shop All Products",
  description: "Browse our extensive collection of tech, fashion, and gear.",
  openGraph: {
    title: "Shop All Products",
    description: "Browse our extensive collection of tech, fashion, and gear.",
    url: `${siteUrl}/shop`,
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

export default function ShopPage() {
  return <ShopPageClient />;
}
