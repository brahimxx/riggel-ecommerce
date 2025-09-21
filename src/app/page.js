import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Separater from "@/components/Separater";
import NewArrivals from "@/components/NewArrivals";
import TopSelling from "@/components/TopSelling";
import CategoriesBanner from "@/components/CategoriesBanner";
import ReviewSection from "@/components/ReviewSection";
import NewSletter from "@/components/NewSletter";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <Separater />
      <NewArrivals />
      <TopSelling />
      <CategoriesBanner />
      <ReviewSection />
      <NewSletter />
      <Footer />
    </>
  );
}
