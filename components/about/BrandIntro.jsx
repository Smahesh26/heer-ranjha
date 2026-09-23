"use client";
import { useEffect, useRef } from "react";
import styles from "./about.module.css";

export default function BrandIntro() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.querySelectorAll(".reveal").forEach((r) => r.classList.add("visible")); }),
      { threshold: 0.1 }
    );
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={styles.brandIntro}>
      <div className={styles.brandIntroInner}>

        {/* Left column: large marker */}
        <div className={styles.introLeft}>
          <div className={`${styles.introMarker} reveal`}>
            <span className={styles.introMarkerLabel}>Our Philosophy</span>
            <span className={`display ${styles.introMarkerWord}`}>Craft</span>
            <span className={styles.introMarkerSub}>Made with intention</span>
          </div>
          <div className={`${styles.introTagline} reveal reveal-delay-2`}>
            <p className="eyebrow">What Guides Us</p>
            <p className={styles.introTaglineText}>
              Heer Ranjha is built on the belief that clothing should feel intimate, considered, and quietly luxurious. We design with the wearer in mind, not the trend cycle.
            </p>
          </div>
        </div>

        {/* Right column: body text */}
        <div className={styles.introRight}>
          <p className={`eyebrow reveal`}>About Heer Ranjha</p>
          <div className="gold-rule reveal reveal-delay-1" />
          <p className={`${styles.introBodyLarge} reveal reveal-delay-2`}>
            Heer Ranjha is a luxury Indian fashion house shaped by heritage craft, modern elegance, and a deeply personal design process.
          </p>
          <p className={`${styles.introBody} reveal reveal-delay-3`}>
            Every garment is imagined to carry a story, whether it is created for a wedding, a celebration, a meaningful gift, or an occasion that deserves to feel memorable.
          </p>
          <p className={`${styles.introBody} reveal reveal-delay-4`}>
            The house is led by Ayush Sethi, Curator &amp; Brand Director, and Ragini Sethi, Head Designer. Their shared vision keeps the brand grounded in craftsmanship while moving it toward a sharper contemporary language.
          </p>
        </div>

      </div>
    </section>
  );
}
