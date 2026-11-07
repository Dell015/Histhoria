import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Histhoria: lore you can trace",
  description:
    "Follow any line of a game's lore back to where it came from, and branch your own theory off canon.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
