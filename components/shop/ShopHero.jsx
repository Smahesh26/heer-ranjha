"use client";
import { useEffect, useRef } from "react";
import styles from "./shop.module.css";

export default function ShopHero() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.querySelectorAll(".reveal").forEach((r) => r.classList.add("visible"));
      }),
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className={styles.shopHero}>
      <div className={styles.shopHeroGrain} aria-hidden="true" />
      <div className={styles.shopHeroInner}>
        <nav className={`${styles.breadcrumb} reveal`} aria-label="Breadcrumb">
          <a href="/" className={styles.breadcrumbLink}>Home</a>
          <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
          <span className={styles.breadcrumbCurrent}>Shop</span>
        </nav>
        <p className={`eyebrow ${styles.shopHeroEyebrow} reveal reveal-delay-1`}>
          Heer Ranjha Atelier
        </p>
        <h1 className={`display ${styles.shopHeroTitle} reveal reveal-delay-2`}>
          The Collection
        </h1>
        <p className={`${styles.shopHeroSub} reveal reveal-delay-3`}>
          Hand-embroidered ensembles for men and women. Every piece made with intention.
        </p>
      </div>
    </section>
  );
}
