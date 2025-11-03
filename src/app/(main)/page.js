import Hero from "@/components/Hero";
import Separater from "@/components/Separater";
import NewArrivals from "@/components/NewArrivals";
import TopSelling from "@/components/TopSelling";
import CategoriesBanner from "@/components/CategoriesBanner";
import ReviewSection from "@/components/ReviewSection";

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
