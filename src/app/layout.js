// src/app/layout.js
import AntdStyledComponentsRegistry from "../components/AntdStyledComponentsRegistry";
import "./styles/globals.css";
import { ConfigProvider, App } from "antd";

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
