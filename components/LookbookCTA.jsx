"use client";
import { useEffect, useRef } from "react";
import styles from "./LookbookCTA.module.css";

const PANELS = [
  {
    id: "men",
    label: "Men's Wear",
    headline: "The Art of\nthe Kurta",
    sub: "Kurtas, Sherwanis, Nehru Jackets, Bandhgalas, hand-embroidered in Matka, Dupion and Raw Silk.",
    cta: "Shop Men's Wear",
    href: "/shop?gender=Men#shop-layout",
    image: "/images/products/black-matka-silk-embroidered-kurta-1.webp",
    objectPosition: "50% 15%",
  },
  {
    id: "women",
    label: "Women's Wear",
    headline: "Dressed in\nDevotion",
    sub: "Sarees, Lehengas, Co-ord Sets and Suit Sets, woven in Chanderi, Dupion and Organza.",
    cta: "Shop Women's Wear",
    href: "/shop?gender=Women#shop-layout",
    image: "/images/products/black-botanical-jacket-with-sharara-set-1.webp",
    objectPosition: "50% 15%",
  },
];

export default function LookbookCTA() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.querySelectorAll(".reveal").forEach((el) => {
              el.classList.add("visible");
            });
          }
        });
      },
      { threshold: 0.15 }
    );
    const el = sectionRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, []);

  return (
    <section ref={sectionRef} id="lookbook" className={styles.section} aria-label="Shop by gender">
      {PANELS.map((panel, pi) => (
        <div key={panel.id} id={panel.id} className={styles.panel}>
          {/* Background art */}
          <div className={styles.panelBg}>
            <img src={panel.image} alt={panel.label} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: panel.objectPosition || 'center' }} />
            <div className={styles.panelOverlay} />
          </div>

          {/* Content */}
          <div className={styles.panelContent}>
            <p className={`eyebrow reveal`} style={{ color: "var(--gold-muted)" }}>{panel.label}</p>
            <h2 className={`display ${styles.panelTitle} reveal reveal-delay-2`}>
              {panel.headline.split("\n").map((line, li) => (
                <span key={li} className={styles.titleLine}>{line}</span>
              ))}
            </h2>
            <p className={`${styles.panelSub} reveal reveal-delay-3`}>{panel.sub}</p>
            <a href={panel.href} className={`btn btn-gold reveal reveal-delay-4`}>
              <span>{panel.cta}</span>
              <span className="btn-arrow">&#8594;</span>
            </a>
          </div>

          {/* Ornamental element */}
          <div className={styles.ornament} aria-hidden="true">
            <div className={styles.ornamentCircle} />
            <div className={styles.ornamentDot} />
          </div>
        </div>
      ))}
    </section>
  );
}
