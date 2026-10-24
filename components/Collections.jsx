"use client";
import { useEffect, useRef } from "react";
import styles from "./Collections.module.css";

import { PRODUCTS, COLLECTIONS as ALL_COLLECTIONS } from "@/components/shop/shopData";

const BASE_COLLECTIONS = [
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
    image: "/images/products/azure-blue-hand-embroidered-kurta-1.webp",
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
    image: "/images/products/peony-pink-hand-embroidered-blazer-set-1.webp",
    objectPosition: "50% 15%",
  },
  {
    id: "roomani",
    eyebrow: "Romantic Collection",
    name: "Roomani",
    translation: "Poetry in Motion",
    desc: "Hand-crafted ensembles featuring delicate floral embroideries, soft pastels, and refined matka silk silhouettes.",
    highlight: "Matka Silk · Hand Embroidery · Floral Motifs",
    cta: "Explore Roomani",
    ctaHref: "/shop?collection=ROOMANI#shop-layout",
    reverse: false,
    accent: "#A38B74",
    image: "/images/products/grey-pin-tuck-kurta-1.jpg",
    objectPosition: "50% 15%",
  },
  {
    id: "ganga-jamuni",
    eyebrow: "Heritage Collection",
    name: "Ganga Jamuni",
    translation: "Sacred Confluence",
    desc: "Crafted in refined Chanderi and artisanal weaves, this collection embodies the poetic union of traditions. Intricate floral embroidery combines machine and handwork across timeless silhouettes.",
    highlight: "Refined Chanderi · Floral Embroidery · Artisanal Craft",
    cta: "Explore Ganga Jamuni",
    ctaHref: "/shop?collection=GANGA+JAMUNI#shop-layout",
    reverse: true,
    accent: "#7D8C6E",
    image: "/images/collections/GangaJamuni/PistaGreenFloraEmbroideredKurta1.jpg",
    objectPosition: "50% 15%",
  },
];

function getCombinedCollections() {
  const list = [...BASE_COLLECTIONS];
  const existingNames = new Set(BASE_COLLECTIONS.map((c) => c.name.toUpperCase()));

  ALL_COLLECTIONS.forEach((colName, idx) => {
    const upper = colName.toUpperCase();
    if (!existingNames.has(upper)) {
      const colProducts = PRODUCTS.filter((p) => String(p.collection || "").toUpperCase() === upper);
      const firstImage = colProducts.find((p) => Array.isArray(p.images) && p.images[0])?.images?.[0] || "/images/products/azure-blue-hand-embroidered-kurta-1.webp";
      const sampleDesc = colProducts[0]?.description || `Discover the exclusive ${colName} collection handcrafted with timeless heritage techniques and refined Indian silhouettes.`;
      const uniqueFabrics = Array.from(new Set(colProducts.map((p) => p.fabric).filter(Boolean))).slice(0, 3).join(" · ") || "Hand Embroidery · Pure Silk";

      list.push({
        id: colName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        eyebrow: "New Collection",
        name: colName,
        translation: "Timeless Heritage",
        desc: sampleDesc,
        highlight: uniqueFabrics,
        cta: `Explore ${colName}`,
        ctaHref: `/shop?collection=${encodeURIComponent(colName)}#shop-layout`,
        reverse: (BASE_COLLECTIONS.length + idx) % 2 === 1,
        accent: "#C9A96E",
        image: firstImage,
        objectPosition: "50% 15%",
      });
      existingNames.add(upper);
    }
  });

  return list;
}

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
  const collectionsList = getCombinedCollections();

  return (
    <section id="collections" className={styles.section}>
      <div className={styles.sectionHeader}>
        <p className="eyebrow">Our Collections</p>
        <h2 className="display" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", color: "var(--charcoal)" }}>
          {collectionsList.length === 3 ? "Three collections, one story" : `${collectionsList.length} Collections, One Story`}
        </h2>
        <p className={styles.sectionSub}>
          Each collection is a conversation between craft and creativity, between India's textile heritage and the pulse of the contemporary.
        </p>
      </div>

      <div className={styles.blocks}>
        {collectionsList.map((col) => (
          <CollectionBlock key={col.id} col={col} />
        ))}
      </div>
    </section>
  );
}
