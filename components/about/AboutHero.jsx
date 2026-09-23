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
          About Heer Ranjha
        </p>

        {/* Headline */}
        <h1 className={`display ${styles.heroTitle} reveal reveal-delay-2`}>
          Contemporary Indian Couture,<br />
          <em className={styles.heroTitleItalic}>Made Personal</em>
        </h1>

        {/* Sub copy */}
        <p className={`${styles.heroSub} reveal reveal-delay-3`}>
          Heer Ranjha is a luxury Indian fashion house rooted in craftsmanship, identity, and storytelling. We create refined menswear and womenswear shaped by heritage artistry, modern sensibility, and a bespoke approach to every client.
        </p>
      </div>

      {/* Decorative side rule */}
      <div className={styles.heroSideRule} aria-hidden="true">
        <div className={styles.heroSideRuleLine} />
        <span className={styles.heroSideRuleText}>Luxury, Personal</span>
      </div>
    </section>
  );
}
