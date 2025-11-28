// src/app/layout.js
import AntdStyledComponentsRegistry from "../components/AntdStyledComponentsRegistry";
import "./styles/globals.css";
import { ConfigProvider, App } from "antd";

const customTheme = {
  token: {
    colorPrimary: "black",
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#f5222d",
    colorInfo: "#5f6163",
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
      <body>
        <ConfigProvider theme={customTheme}>
          <AntdStyledComponentsRegistry>
            <App>{children}</App>
          </AntdStyledComponentsRegistry>
        </ConfigProvider>
      </body>
    </html>
  );
}
