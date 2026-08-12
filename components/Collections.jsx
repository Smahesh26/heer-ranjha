"use client";
import { useEffect, useRef } from "react";
import styles from "./Collections.module.css";

const COLLECTIONS = [
  {
    id: "nayi-leher",
    eyebrow: "Current Collection",
    name: "Nayi Leher",
    translation: "New Wave",
    desc: "A vibrant ensemble of Matka and Dupion silks, shaped by the energy of new beginnings. Kurtas in soft pinks and blues meet hand-embroidered Nehru jackets and Sherwanis that carry the weight of Indian craftsmanship.",
    highlight: "Hand Embroidery · Matka Silk · Dupion Fabric",
    cta: "Explore Nayi Leher",
    ctaHref: "/shop?collection=NAYI+LEHER#shop-layout",
    reverse: false,
    accent: "#C9A96E",
    image: "/images/products/azure-blue-hand-emroidered-kurta-1.jpg",
    objectPosition: "50% 15%",
  },
  {
    id: "asaya",
    eyebrow: "Signature Collection",
    name: "Asaya",
    translation: "Comfort, refined",
    desc: "Where Indo-Western sensibility meets Indian craftsmanship. Dupion silk co-ord sets, Chanderi ensembles, and architectural silhouettes for the woman who holds both worlds with ease.",
    highlight: "Dupion Silk · Chanderi · Indo-Western",
    cta: "Explore Asaya",
    ctaHref: "/shop?collection=ASAYA#shop-layout",
    reverse: true,
    accent: "#9E7B5A",
    image: "/images/products/indo-western-sunshine-yellow-3pc-suit-set-1.jpg",
    objectPosition: "50% 15%",
  },
];

function useReveal(ref) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            entry.target.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
          }
        });
      },
      { threshold: 0.12 }
    );
    const el = ref.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, []);
}

function CollectionBlock({ col }) {
  const ref = useRef(null);
  useReveal(ref);

  return (
    <article
      id={col.id}
      ref={ref}
      className={`${styles.block} ${col.reverse ? styles.reverse : ""} reveal`}
    >
      {/* Visual panel */}
      <div className={styles.visual}>
        <div className={styles.imageWrap}>
          {/* Abstract fabric swatch art as placeholder */}
          <div className={styles.swatchCanvas}>
            <img src={col.image} alt={col.name} className={styles.collectionImage} style={{ objectPosition: col.objectPosition || 'top' }} />
            <div className={styles.swatchOverlay} />
            <div className={styles.swatchLabel}>
              <span className="eyebrow">{col.eyebrow}</span>
            </div>
          </div>

          {/* Ornamental frame corners */}
          <div className={`${styles.corner} ${styles.cornerTL}`} />
          <div className={`${styles.corner} ${styles.cornerTR}`} />
          <div className={`${styles.corner} ${styles.cornerBL}`} />
          <div className={`${styles.corner} ${styles.cornerBR}`} />
        </div>
      </div>

      {/* Text panel */}
      <div className={styles.text}>
        <p className="eyebrow reveal reveal-delay-1">{col.eyebrow}</p>
        <div className={`gold-rule reveal reveal-delay-1`} />
        <h2 className={`display ${styles.colName} reveal reveal-delay-2`}>
          {col.name}
        </h2>
        <p className={`display-italic ${styles.translation} reveal reveal-delay-2`}>
          {col.translation}
        </p>
        <p className={`${styles.desc} reveal reveal-delay-3`}>{col.desc}</p>
        <p className={`eyebrow ${styles.highlight} reveal reveal-delay-4`}>
          {col.highlight}
        </p>
        <a href={col.ctaHref || `/shop?collection=${col.id}#shop-layout`} className={`btn reveal reveal-delay-5`}>
          <span>{col.cta}</span>
          <span className="btn-arrow">&#8594;</span>
        </a>
      </div>
    </article>
  );
}

export default function Collections() {
  return (
    <section id="collections" className={styles.section}>
      <div className={styles.sectionHeader}>
        <p className="eyebrow">Our Collections</p>
        <h2 className="display" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", color: "var(--charcoal)" }}>
          Two collections, one story
        </h2>
        <p className={styles.sectionSub}>
          Each collection is a conversation between craft and creativity, between India's textile heritage and the pulse of the contemporary.
        </p>
      </div>

      <div className={styles.blocks}>
        {COLLECTIONS.map((col) => (
          <CollectionBlock key={col.id} col={col} />
        ))}
      </div>
    </section>
  );
}
