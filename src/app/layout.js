// src/app/layout.js
import AntdStyledComponentsRegistry from "../components/AntdStyledComponentsRegistry";
import "./styles/globals.css";

export const metadata = {
  title: "Riggel ecommerce",
  description: "An ecommerce platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <AntdStyledComponentsRegistry>{children}</AntdStyledComponentsRegistry>
      </body>
    </html>
  );
}
