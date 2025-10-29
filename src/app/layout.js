import "@ant-design/v5-patch-for-react-19";
import "./styles/globals.css";
import Header from "@/components/Header";
import NewsLetter from "@/components/NewsLetter";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Riggel ecommerce",
  description: "An ecommerce platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <Header />
        {children}
        <NewsLetter />
        <Footer />
      </body>
    </html>
  );
}
