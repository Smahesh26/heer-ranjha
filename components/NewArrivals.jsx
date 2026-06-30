"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./NewArrivals.module.css";

const PRODUCTS = [
  {
    id: 1,
    category: "Men",
    sub: "Kurta Set",
    name: "Pink Matka Kurta",
    detail: "Cotton Pant · Hand Embroidery",
    collection: "Nayi Leher",
    code: "HKM-304",
    color: "#D4A090",
    accent: "#8A5040",
  },
  {
    id: 2,
    category: "Men",
    sub: "Nehru Jacket",
    name: "Sky Blue Nehru Jacket",
    detail: "Hand Embroidery · Indian Ethnic",
    collection: "Nayi Leher",
    code: "HJM-311",
    color: "#7AA8C8",
    accent: "#2A6080",
  },
  {
    id: 3,
    category: "Women",
    sub: "Lehenga Set",
    name: "Red Chanderi Lehenga",
    detail: "Organza Dupatta · Hand Embroidery",
    collection: "Asaya",
    code: "AL-1430",
    color: "#C04040",
    accent: "#8A1A1A",
  },
  {
    id: 4,
    category: "Women",
    sub: "Co-ord Set",
    name: "Midnight Blue Dupion",
    detail: "2PC Co-ord Set · Hand Embroidery",
    collection: "Asaya",
    code: "AI-1426",
    color: "#2A3A6A",
    accent: "#101830",
  },
  {
    id: 5,
    category: "Men",
    sub: "Sherwani",
    name: "Mint Green Sherwani",
    detail: "Dupion Fabric · Hand Embroidery",
    collection: "Nayi Leher",
    code: "HSD-348",
    color: "#7ABAA0",
    accent: "#2A6A50",
  },
  {
    id: 6,
    category: "Women",
    sub: "Suit Set",
    name: "Green Dupion Set",
    detail: "Red Organza Dupatta · Indian Ethnic",
    collection: "Nayi Leher",
    code: "AS-2077",
    color: "#4A8A60",
    accent: "#1A4030",
  },
  {
    id: 7,
    category: "Men",
    sub: "Bandhgala Set",
    name: "Navy Blue Bandhgala",
    detail: "Matka Fabric · Hand Embroidery",
    collection: "Nayi Leher",
    code: "HBM-336",
    color: "#2A3A60",
    accent: "#0A1030",
  },
  {
    id: 8,
    category: "Women",
    sub: "Sharara Set",
    name: "Silver Tissue Sharara",
    detail: "4PC Set with Potli · Hand Embroidery",
    collection: "Asaya",
    code: "AS-1756",
    color: "#B0B0B8",
    accent: "#606070",
  },
];

const FILTERS = ["All", "Men", "Women"];

function ProductCard({ product, index }) {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.15 }
    );
    const el = ref.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.card} reveal`}
      style={{ transitionDelay: `${(index % 4) * 0.1}s` }}
    >
      {/* Image placeholder */}
      <div className={styles.cardImage}>
        <div
          className={styles.cardBg}
          style={{
            background: `radial-gradient(ellipse 70% 70% at 60% 40%, ${product.color} 0%, ${product.accent} 100%)`,
          }}
        />
        <div className={styles.cardOverlay} />

        {/* Product code badge */}
        <span className={styles.codeBadge}>{product.code}</span>

        {/* Collection tag */}
        <span className={styles.collectionTag}>{product.collection}</span>

        {/* Hover action */}
        <div className={styles.cardActions}>
          <button className={styles.viewBtn}>
            <span>View Piece</span>
          </button>
        </div>
      </div>

      {/* Card info */}
      <div className={styles.cardInfo}>
        <p className={styles.cardSub}>{product.sub}</p>
        <h3 className={`display ${styles.cardName}`}>{product.name}</h3>
        <p className={styles.cardDetail}>{product.detail}</p>
      </div>
    </div>
  );
}

export default function NewArrivals() {
  const [activeFilter, setActiveFilter] = useState("All");
  const headerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.2 }
    );
    const el = headerRef.current;
    if (el) {
      el.querySelectorAll(".reveal").forEach((r) => observer.observe(r));
    }
    return () => observer.disconnect();
  }, []);

  const filtered = activeFilter === "All"
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === activeFilter);

  return (
    <section id="new-arrivals" className={styles.section}>
      <div className={styles.header} ref={headerRef}>
        <p className="eyebrow reveal">New Arrivals</p>
        <div className="gold-rule reveal reveal-delay-1" />
        <h2 className={`display ${styles.title} reveal reveal-delay-2`}>
          Pieces from<br />
          <em>our latest collections</em>
        </h2>
        <p className={`${styles.sub} reveal reveal-delay-3`}>
          Handcrafted ensembles for men and women, drawn from the Nayi Leher and Asaya collections.
        </p>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${activeFilter === f ? styles.filterActive : ""}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {filtered.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      <div className={styles.viewAllWrap}>
        <a href="#collections" className="btn">
          <span>View All Collections</span>
          <span className="btn-arrow">&#8594;</span>
        </a>
      </div>
    </section>
  );
}
