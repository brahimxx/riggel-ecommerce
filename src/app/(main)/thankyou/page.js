// src/app/thankyou/page.js
import ThankYouClient from "@/components/ThankYouClient";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata = {
  // Becomes "Order Confirmation | Riggel" via layout title template
  title: "Order Confirmation",
  description:
    "Order confirmed on Riggel. View a summary of your purchase and payment details.",
  openGraph: {
    title: "Order Confirmation",
    description:
      "Order confirmed on Riggel. View a summary of your purchase and payment details.",
    url: `${siteUrl}/thankyou`,
    siteName: "Riggel",
    locale: "en_US",
    type: "website",
  },
};

export default function ThankYou() {
  return <ThankYouClient />;
}
