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
            <span className={styles.introMarkerLabel}>Our story begins with</span>
            <span className={`display ${styles.introMarkerWord}`}>Ishq</span>
            <span className={styles.introMarkerSub}>Love, in every thread</span>
          </div>
          <div className={`${styles.introTagline} reveal reveal-delay-2`}>
            <p className="eyebrow">The Name</p>
            <p className={styles.introTaglineText}>
              Heer and Ranjha, Punjab’s most enduring lovers. Their story is not just folklore. It is the sound of longing rendered in verse, passed from grandmother to grandchild, sung at thresholds and celebrations alike. We carry that name into every stitch.
            </p>
          </div>
        </div>

        {/* Right column: body text */}
        <div className={styles.introRight}>
          <p className={`eyebrow reveal`}>About the Boutique</p>
          <div className="gold-rule reveal reveal-delay-1" />
          <p className={`${styles.introBodyLarge} reveal reveal-delay-2`}>
            Heer Ranjha is a luxury Indian fashion boutique, with atelier addresses in Delhi and Bareilly. We make clothes for people who believe that what they wear is an extension of who they are.
          </p>
          <p className={`${styles.introBody} reveal reveal-delay-3`}>
            Each piece in our wardrobe is hand-embroidered by artisans who have spent lifetimes mastering techniques rooted in the subcontinent’s court traditions. We work in Matka, Dupion, Chanderi, Raw Silk, and Organza, fabrics chosen for their ability to hold embroidery beautifully and move with the body.
          </p>
          <p className={`${styles.introBody} reveal reveal-delay-4`}>
            Our collections span the full vocabulary of Indian dress: Kurtas and Nehru Jackets for men; Lehengas, Sarees, Suit Sets, and Co-ord Sets for women. Each collection is named for a feeling. Nayi Leher. Asaya. Roomani. Ganga Jamuni. The clothes carry those names honestly.
          </p>
        </div>

      </div>
    </section>
  );
}
