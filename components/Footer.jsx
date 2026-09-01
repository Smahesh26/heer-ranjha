import Image from "next/image";
import styles from "./Footer.module.css";

const LINKS = {
  Collections: [
    { label: "Nayi Leher", href: "/shop?collection=NAYI+LEHER#shop-layout" },
    { label: "Asaya", href: "/shop?collection=ASAYA#shop-layout" },
    { label: "Roomani", href: "/shop?collection=ROOMANI#shop-layout" },
  ],
  "Men's Wear": [
    { label: "Kurta Sets", href: "/shop?gender=Men&subCategory=Kurta#shop-layout" },
    { label: "Nehru Jackets", href: "/shop?gender=Men&subCategory=Waistcoat#shop-layout" },
    { label: "Sherwanis", href: "/shop?gender=Men&subCategory=Sherwani#shop-layout" },
    { label: "Bandhgalas", href: "/shop?gender=Men&subCategory=Bandhgala#shop-layout" },
  ],
  "Women's Wear": [
    { label: "Sarees", href: "/shop?gender=Women&subCategory=Saree+Set#shop-layout" },
    { label: "Lehenga Sets", href: "/shop?gender=Women&subCategory=3Pc+Lehenga+set#shop-layout" },
    { label: "Suit Sets", href: "/shop?gender=Women&subCategory=Suit+Set#shop-layout" },
    { label: "Co-ord Sets", href: "/shop?gender=Women&subCategory=Co-Ord+Set#shop-layout" },
  ],
  Info: [
    { label: "About Us", href: "/about-us" },
    { label: "Our Craft", href: "/about-us#craft" },
    { label: "Lookbook", href: "/#lookbook" },
    { label: "Our Stores", href: "/stores" },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} id="stores">
      {/* Stores strip */}
      <div className={styles.storesStrip}>
        <div className={styles.storesInner}>
          <a href="/stores" className={styles.storeCard}>
            <p className="eyebrow" style={{ color: "var(--gold-muted)" }}>Delhi Boutique</p>
            <p className={styles.storeAddr}>New Delhi, India</p>
          </a>
          <div className={styles.storeDivider} aria-hidden="true" />
          <a href="/stores" className={styles.storeCard}>
            <p className="eyebrow" style={{ color: "var(--gold-muted)" }}>Bareilly Boutique</p>
            <p className={styles.storeAddr}>Bareilly, Uttar Pradesh</p>
          </a>
        </div>
      </div>

      {/* Main footer */}
      <div className={styles.main}>
        {/* Logo + tagline */}
        <div className={styles.brand}>
          <Image
            src="/logo.png"
            alt="Heer Ranjha"
            width={120}
            height={150}
            className={styles.footerLogo}
          />
          <p className={`display-italic ${styles.tagline}`}>
            Where craft meets couture
          </p>
          <p className={styles.brandDesc}>
            A luxury Indian fashion boutique offering hand-embroidered ensembles for men and women. Boutiques in Delhi and Bareilly.
          </p>
        </div>

        {/* Nav columns */}
        <div className={styles.navCols}>
          {Object.entries(LINKS).map(([category, items]) => (
            <div key={category} className={styles.navCol}>
              <h4 className={styles.colHead}>{category}</h4>
              <ul className={styles.colList}>
                {items.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className={styles.colLink}>{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <p className={styles.copy}>
          &copy; {year} Heer Ranjha. All rights reserved.
        </p>
        <div className={styles.social}>
          <a href="https://www.instagram.com/worldofheerranjha/?hl=en" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
          </a>
        </div>
        <p className={styles.madeBy}>
          Designed by <a href="https://www.ghb.digital/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Global Honey Bee (GHB)</a>
        </p>
      </div>
    </footer>
  );
}
