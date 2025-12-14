// src/app/thankyou/page.js
import ThankYouClient from "@/components/ThankYouClient";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata = {
  title: "Order Confirmation",
  description:
    "Order confirmed on Riggel. View a summary of your purchase and payment details.",
  openGraph: {
    title: "Order Confirmation",
    description:
      "Order confirmed on Riggel. View a summary of your purchase and payment details.",
    url: `${siteUrl}/thankyou`,
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

export default function ThankYou() {
  return <ThankYouClient />;
}
