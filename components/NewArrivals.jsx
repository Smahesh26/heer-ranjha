"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./NewArrivals.module.css";
import { PRODUCTS } from "@/components/shop/shopData";

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

  const normalizedSlug = String(product.slug || product.id || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "");
    
  const previewImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;

  return (
    <div
      ref={ref}
      className={`${styles.card} reveal`}
      style={{ transitionDelay: `${(index % 4) * 0.1}s` }}
    >
      {/* Image placeholder */}
      <div className={styles.cardImage}>
        {previewImage ? (
          <img className={styles.cardBg} src={previewImage} alt={product.name} style={{ objectFit: 'cover' }} />
        ) : (
          <div
            className={styles.cardBg}
            style={{
              background: `radial-gradient(ellipse 70% 70% at 60% 40%, #d4c2a3 0%, #7a5635 100%)`,
            }}
          />
        )}
        <div className={styles.cardOverlay} />

        {/* Product code badge */}
        <span className={styles.codeBadge}>{product.code || product.slug}</span>

        {/* Collection tag */}
        <span className={styles.collectionTag}>{product.collection}</span>

        {/* Hover action */}
        <div className={styles.cardActions}>
          <a href={`/product/${normalizedSlug}`} className={styles.viewBtn}>
            <span>View Piece</span>
          </a>
        </div>
      </div>

      {/* Card info */}
      <div className={styles.cardInfo}>
        <p className={styles.cardSub}>{product.subCategory || product.category}</p>
        <h3 className={`display ${styles.cardName}`}>{product.name}</h3>
        <p className={styles.cardDetail}>{product.detail || product.description}</p>
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

  const newArrivals = PRODUCTS.slice(0, 8);
  const filtered = activeFilter === "All"
    ? newArrivals
    : newArrivals.filter((p) => p.category === activeFilter);

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
        <a href="/shop" className="btn">
          <span>View All Collections</span>
          <span className="btn-arrow">&#8594;</span>
        </a>
      </div>
    </section>
  );
}
