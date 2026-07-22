import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel do Casamento",
  description: "Sistema administrativo do casamento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
