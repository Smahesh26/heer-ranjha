import Image from "next/image";
import styles from "./Footer.module.css";

const LINKS = {
  Collections: ["Nayi Leher", "Asaya", "Roomani", "Ganga Jamuni"],
  "Men's Wear": ["Kurta Sets", "Nehru Jackets", "Sherwanis", "Bandhgalas"],
  "Women's Wear": ["Sarees", "Lehenga Sets", "Suit Sets", "Co-ord Sets"],
  Info: ["About Us", "Our Craft", "Lookbook", "Contact"],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} id="stores">
      {/* Stores strip */}
      <div className={styles.storesStrip}>
        <div className={styles.storesInner}>
          <div className={styles.storeCard}>
            <p className="eyebrow" style={{ color: "var(--gold-muted)" }}>Delhi Boutique</p>
            <p className={styles.storeAddr}>New Delhi, India</p>
          </div>
          <div className={styles.storeDivider} aria-hidden="true" />
          <div className={styles.storeCard}>
            <p className="eyebrow" style={{ color: "var(--gold-muted)" }}>Bareilly Boutique</p>
            <p className={styles.storeAddr}>Bareilly, Uttar Pradesh</p>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className={styles.main}>
        {/* Logo + tagline */}
        <div className={styles.brand}>
          <Image
            src="/logo.png"
            alt="Heer Ranjha"
            width={80}
            height={100}
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
                  <li key={item}>
                    <a href="#" className={styles.colLink}>{item}</a>
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
          <a href="#" className={styles.socialLink} aria-label="Instagram">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
          </a>
          <a href="#" className={styles.socialLink} aria-label="Facebook">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a href="#" className={styles.socialLink} aria-label="Pinterest">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a10 10 0 0 0-3.7 19.3c0-.8.1-2.2.3-3.1l1.5-6.4s-.4-.8-.4-1.9c0-1.8 1-3.1 2.3-3.1 1.1 0 1.6.8 1.6 1.8 0 1.1-.7 2.7-1 4.2-.3 1.3.6 2.3 1.7 2.3 2.1 0 3.5-2.7 3.5-5.8 0-2.4-1.6-4.2-4.5-4.2-3.3 0-5.3 2.4-5.3 5.1 0 .9.3 1.6.7 2.1" />
            </svg>
          </a>
        </div>
        <p className={styles.madeBy}>
          Designed with intention.
        </p>
      </div>
    </footer>
  );
}
