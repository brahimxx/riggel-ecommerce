// src/app/(main)/layout.js
import Header from "@/components/Header";
import NewsLetter from "@/components/NewSletter";
import Footer from "@/components/Footer";

export default function MainLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <NewsLetter />
      <Footer />
    </>
  );
}
