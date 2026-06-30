"use client";
import { useEffect, useRef } from "react";
import styles from "./about.module.css";

export default function AboutHero() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.15 }
    );
    items.forEach((i) => observer.observe(i));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={styles.hero}>
      {/* Grain texture */}
      <div className={styles.heroGrain} aria-hidden="true" />

      <div className={styles.heroInner}>
        {/* Breadcrumb */}
        <nav className={`${styles.breadcrumb} reveal`} aria-label="Breadcrumb">
          <a href="/" className={styles.breadcrumbLink}>Home</a>
          <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
          <span className={styles.breadcrumbCurrent}>About Us</span>
        </nav>

        {/* Eyebrow */}
        <p className={`eyebrow ${styles.heroEyebrow} reveal reveal-delay-1`}>
          Est. Delhi &amp; Bareilly
        </p>

        {/* Headline */}
        <h1 className={`display ${styles.heroTitle} reveal reveal-delay-2`}>
          Where a Love Story<br />
          <em className={styles.heroTitleItalic}>Became a Wardrobe</em>
        </h1>

        {/* Sub copy */}
        <p className={`${styles.heroSub} reveal reveal-delay-3`}>
          Named for two souls whose devotion outlasted time, Heer Ranjha is a boutique built on the same principle: that what is made with love endures.
        </p>
      </div>

      {/* Decorative side rule */}
      <div className={styles.heroSideRule} aria-hidden="true">
        <div className={styles.heroSideRuleLine} />
        <span className={styles.heroSideRuleText}>About Us</span>
      </div>
    </section>
  );
}
