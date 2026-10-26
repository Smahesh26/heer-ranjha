"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import styles from "./Collections.module.css";

import { PRODUCTS } from "@/components/shop/shopData";

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

function getCombinedCollections(currentProducts = PRODUCTS) {
  const activeProducts = currentProducts.filter((p) => p.active !== false);

  // Group active products by collection name
  const colProductsMap = new Map();
  for (const p of activeProducts) {
    const colName = String(p.collection || "").trim().toUpperCase();
    if (!colName) continue;
    if (!colProductsMap.has(colName)) {
      colProductsMap.set(colName, []);
    }
    colProductsMap.get(colName).push(p);
  }

  const list = [];
  const processedNames = new Set();

  // 1. Include base collections ONLY IF they have at least 1 product
  for (const baseCol of BASE_COLLECTIONS) {
    const upper = baseCol.name.toUpperCase();
    const items = colProductsMap.get(upper) || [];
    if (items.length > 0) {
      list.push({
        ...baseCol,
        reverse: list.length % 2 === 1,
      });
      processedNames.add(upper);
    }
  }

  // 2. Include any dynamic / custom collections ONLY IF they have at least 1 product
  colProductsMap.forEach((items, colName) => {
    if (!processedNames.has(colName) && items.length > 0) {
      const firstImage =
        items.find((p) => Array.isArray(p.images) && p.images[0])?.images?.[0] ||
        "/images/products/azure-blue-hand-embroidered-kurta-1.webp";
      const sampleDesc =
        items[0]?.description ||
        `Discover the exclusive ${colName} collection handcrafted with timeless heritage techniques and refined Indian silhouettes.`;
      const uniqueFabrics =
        Array.from(new Set(items.map((p) => p.fabric).filter(Boolean))).slice(0, 3).join(" · ") ||
        "Hand Embroidery · Pure Silk";

      list.push({
        id: colName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        eyebrow: "New Collection",
        name: colName,
        translation: "Timeless Heritage",
        desc: sampleDesc,
        highlight: uniqueFabrics,
        cta: `Explore ${colName}`,
        ctaHref: `/shop?collection=${encodeURIComponent(colName)}#shop-layout`,
        reverse: list.length % 2 === 1,
        accent: "#C9A96E",
        image: firstImage,
        objectPosition: "50% 15%",
      });
      processedNames.add(colName);
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
  const [productsList, setProductsList] = useState(PRODUCTS);

  useEffect(() => {
    let active = true;
    async function loadLiveProducts() {
      try {
        const res = await fetch("/api/products?active=true", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data?.products)) {
            setProductsList(data.products);
          }
        }
      } catch {
        // fallback to initial
      }
    }
    loadLiveProducts();
    return () => {
      active = false;
    };
  }, []);

  const collectionsList = useMemo(() => getCombinedCollections(productsList), [productsList]);

  if (collectionsList.length === 0) return null;

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

