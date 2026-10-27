import { Cormorant_Garamond, Jost } from "next/font/google";
import Script from "next/script";
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
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`}>
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-44NJQWNPXC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-44NJQWNPXC');
          `}
        </Script>
      </head>
      <body>
        <ScrollObserver />
        {children}
      </body>
    </html>
  );
}

