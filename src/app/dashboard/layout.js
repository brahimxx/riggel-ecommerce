import "./dashboard.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
