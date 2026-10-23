import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#181A1D",
};

export const metadata: Metadata = {
  title: {
    template: "%s",
    default: "Official Online Store",
  },
  description: "Shop quality products delivered directly to your doorstep with fast Cash on Delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#CBD5CE] text-slate-900 min-h-screen selection:bg-[#FF6448] selection:text-white overflow-x-hidden`}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
