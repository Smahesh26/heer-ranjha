import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import ScrollObserver from "../components/ScrollObserver";
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata = {
  title: "Heer Ranjha | Luxury Indian Couture",
  description:
    "Where craft meets couture. Heer Ranjha is a luxury Indian fashion boutique offering hand-embroidered ensembles for men and women. Boutiques in Delhi and Bareilly.",
  keywords:
    "luxury Indian fashion, hand embroidery, kurta, lehenga, sherwani, Delhi boutique, Indian couture, ethnic wear",
  openGraph: {
    title: "Heer Ranjha | Luxury Indian Couture",
    description:
      "Where craft meets couture. Hand-embroidered ensembles for men and women.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`}>
      <body>
        <ScrollObserver />
        {children}
      </body>
    </html>
  );
}
