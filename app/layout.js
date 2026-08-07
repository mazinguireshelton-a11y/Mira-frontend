import "./globals.css";

export const metadata = {
  title: "Mira",
  description: "Encontra os clientes certos, sem perder tempo.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
