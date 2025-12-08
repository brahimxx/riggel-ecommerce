// src/app/(main)/layout.js
import Header from "@/components/Header";
import NewsLetter from "@/components/NewsLetter";
import Footer from "@/components/Footer";
import { CartProvider } from "@/components/CartContext";

export default function MainLayout({ children }) {
  return (
    <CartProvider>
      <>
        <Header />
        {children}
        <NewsLetter />
        <Footer />
      </>
    </CartProvider>
  );
}
