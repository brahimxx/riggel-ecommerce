// src/app/page.js
import Hero from "@/components/Hero";
import Separater from "@/components/Separater";
import NewArrivals from "@/components/NewArrivals";
import TopSelling from "@/components/TopSelling";
import CategoriesBanner from "@/components/CategoriesBanner";
import ReviewSection from "@/components/ReviewSection";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata = {
  // Becomes "Modern Clothing & Streetwear | Riggel" via layout template
  title: "Modern Clothing & Streetwear",
  description:
    "Riggel is a modern clothing store offering stylish, everyday pieces designed to express your individuality and sense of style.",
  openGraph: {
    title: "Modern Clothing & Streetwear",
    description:
      "Discover curated outfits, essentials, and statement pieces from Riggel, your go-to store for contemporary clothing.",
    url: siteUrl,
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <Separater />
      <NewArrivals />
      <TopSelling />
      <CategoriesBanner />
      <ReviewSection />
    </>
  );
}
