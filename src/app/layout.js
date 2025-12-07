// src/app/layout.js
import AntdStyledComponentsRegistry from "../components/AntdStyledComponentsRegistry";
import "./styles/globals.css";
import localFont from "next/font/local";
import { ConfigProvider } from "antd";

// 1. Configure "Integral CF" (assuming it's a static font)
const integralCF = localFont({
  src: [
    {
      path: "../../public/fonts/integralcf/Integral CF.ttf",
      weight: "400",
      style: "normal",
    },
    // Add other weights here if you have them, e.g., bold
  ],
  variable: "--font-integral", // Define a CSS variable name
});

// 2. Configure "Satoshi" (Variable Font)
const satoshi = localFont({
  src: "../../public/fonts/satoshi/Satoshi-Variable.ttf",
  display: "swap",
  variable: "--font-satoshi",
  weight: "100 900", // Variable font weight range
});

const customTheme = {
  token: {
    colorPrimary: "#669900",
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#f5222d",
    colorInfo: "black",
  },
  components: {
    Menu: {
      // When an item is selected, make the text white
      itemSelectedColor: "white",
      // When an item is selected, make the background black
      itemSelectedBg: "#669900",
      // Optional: Change hover color if needed
      itemHoverColor: "#000000",
      itemHoverBg: "rgba(0, 0, 0, 0.06)",
    },
  },
};

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
      <body
        className={`${satoshi.variable} ${integralCF.variable} antialiased font-sans`}
      >
        <ConfigProvider theme={customTheme}>
          <AntdStyledComponentsRegistry>
            {children}
          </AntdStyledComponentsRegistry>
        </ConfigProvider>
      </body>
    </html>
  );
}
