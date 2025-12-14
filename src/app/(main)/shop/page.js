import ShopPageClient from "@/components/ShopPageClient";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata = {
  // This becomes "Shop All Products | Riggel" because of layout.js template
  title: "Shop All Products",
  description: "Browse our extensive collection of tech, fashion, and gear.",
  openGraph: {
    title: "Shop All Products",
    description: "Browse our extensive collection of tech, fashion, and gear.",
    url: `${siteUrl}/shop`,
    // siteName / locale / type can be inherited, but you may keep them:
    siteName: "Riggel",
    locale: "en_US",
    type: "website",
  },
};

export default function ShopPage() {
  return <ShopPageClient />;
}
