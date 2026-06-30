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
    reverse: false,
    accent: "#C9A96E",
    swatches: ["#E8B4A0", "#A8C4D4", "#D4C46A", "#98B4A0"],
  },
  {
    id: "asaya",
    eyebrow: "Signature Collection",
    name: "Asaya",
    translation: "Comfort, refined",
    desc: "Where Indo-Western sensibility meets Indian craftsmanship. Dupion silk co-ord sets, Chanderi ensembles, and architectural silhouettes for the woman who holds both worlds with ease.",
    highlight: "Dupion Silk · Chanderi · Indo-Western",
    cta: "Explore Asaya",
    reverse: true,
    accent: "#9E7B5A",
    swatches: ["#4A5A7A", "#8A4A5A", "#2A5A3A", "#C8B87A"],
  },
  {
    id: "roomani",
    eyebrow: "Archive Collection",
    name: "Roomani",
    translation: "Romantic, ardent",
    desc: "Soft pinks and earthy tones rendered in Matka fabric. Kurtas, Nehru Jackets, Bandhgalas, and Sherwanis embroidered with intimate precision. A love letter written in thread and cloth.",
    highlight: "Machine Embroidery · Hand Embroidery · Indian Ethnic",
    cta: "Explore Roomani",
    reverse: false,
    accent: "#B87A7A",
    swatches: ["#C89090", "#7090B0", "#909090", "#607050"],
  },
  {
    id: "ganga-jamuni",
    eyebrow: "Heritage Collection",
    name: "Ganga Jamuni",
    translation: "Two rivers, one culture",
    desc: "An ode to India's composite heritage. Raw silks and handloom weaves carry the shared vocabulary of communities, rendered in ensembles that speak of courts, rivers, and the quiet majesty of everyday devotion.",
    highlight: "Raw Silk · Handloom · Indian Ethnic",
    cta: "Explore Collection",
    reverse: true,
    accent: "#7A9E7A",
    swatches: ["#6A8090", "#905A3A", "#7A9A5A", "#4A5A8A"],
  },
];

function useReveal(ref) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
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
            {col.swatches.map((color, i) => (
              <div
                key={i}
                className={styles.swatch}
                style={{
                  background: color,
                  left: `${[12, 52, 10, 55][i]}%`,
                  top: `${[8, 15, 55, 60][i]}%`,
                  width: `${[45, 38, 42, 40][i]}%`,
                  height: `${[40, 36, 38, 35][i]}%`,
                  opacity: [0.65, 0.55, 0.5, 0.6][i],
                  animationDelay: `${i * 0.8}s`,
                }}
              />
            ))}
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
        <a href={`#${col.id}`} className={`btn reveal reveal-delay-5`}>
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
          Four chapters, one story
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
