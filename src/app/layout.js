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

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Riggel | Premium E-Commerce",
    template: "%s | Riggel",
  },

  description:
    "Designed to bring out your individuality and cater to your sense of style",

  openGraph: {
    title: "Riggel | Premium E-Commerce",
    description:
      "Designed to bring out your individuality and cater to your sense of style",
    url: siteUrl,
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
