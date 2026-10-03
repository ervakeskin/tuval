import type { Metadata } from "next";
import { Inter, Poppins, Montserrat, Noto_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";

// latin-ext: ğ, ş, ı, İ, ç, ö, ü için gerekli
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin", "latin-ext"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin", "latin-ext"] });
const noto = Noto_Sans({ variable: "--font-noto", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: `${APP_NAME} — Türkçe AI Sunum Aracı`,
  description: APP_TAGLINE,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${poppins.variable} ${montserrat.variable} ${noto.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
