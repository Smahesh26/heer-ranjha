"use client";
import { useEffect, useRef } from "react";
import styles from "./about.module.css";

export default function StorySection() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.querySelectorAll(".reveal").forEach((r) => r.classList.add("visible")); }),
      { threshold: 0.08 }
    );
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={styles.story}>

      {/* Image panel */}
      <div className={styles.storyImage}>
        <div className={styles.storyImageInner}>
          {/* Placeholder art: layered fabric-inspired abstract */}
          <div className={styles.storyImageBlob1} />
          <div className={styles.storyImageBlob2} />
          <div className={styles.storyImageOverlay} />
          {/* Floating label */}
          <div className={styles.storyImageLabel}>
            <p className="eyebrow" style={{ color: "var(--warm-white)", opacity: 0.7 }}>The Atelier</p>
            <p className={styles.storyImageLabelText}>Delhi &amp; Bareilly</p>
          </div>
          {/* Corner ornaments */}
          <div className={`${styles.corner} ${styles.cornerTL}`} />
          <div className={`${styles.corner} ${styles.cornerBR}`} />
        </div>
      </div>

      {/* Text panel */}
      <div className={styles.storyText}>
        <p className={`eyebrow reveal`}>The Craft</p>
        <div className="gold-rule reveal reveal-delay-1" />
        <h2 className={`display ${styles.storyTitle} reveal reveal-delay-2`}>
          Made by Hand.<br />
          <em>Kept for a Lifetime.</em>
        </h2>
        <p className={`${styles.storyBody} reveal reveal-delay-3`}>
          Every piece that leaves our atelier has been touched by at least a dozen pairs of hands. The cutter who shapes the cloth. The artisan who maps the embroidery pattern. The needleworker who brings it to life, stitch by counted stitch. The finisher who ensures every seam is worthy of the wearer.
        </p>
        <p className={`${styles.storyBody} reveal reveal-delay-4`}>
          We do not use embroidery as decoration. We use it as language. Our patterns draw from Mughal motifs, folk geometry, and the living vernacular of North Indian craft, reinterpreted through a contemporary lens that respects without replicating.
        </p>

        {/* Story details */}
        <div className={`${styles.storyDetails} reveal reveal-delay-4`}>
          <div className={styles.storyDetail}>
            <span className={`display ${styles.storyDetailNum}`}>4</span>
            <span className={styles.storyDetailLabel}>Living Collections</span>
          </div>
          <div className={styles.storyDetailDivider} />
          <div className={styles.storyDetail}>
            <span className={`display ${styles.storyDetailNum}`}>2</span>
            <span className={styles.storyDetailLabel}>Boutique Addresses</span>
          </div>
          <div className={styles.storyDetailDivider} />
          <div className={styles.storyDetail}>
            <span className={`display ${styles.storyDetailNum}`}>100+</span>
            <span className={styles.storyDetailLabel}>Artisan Techniques</span>
          </div>
        </div>

        <a href="/" className={`btn reveal reveal-delay-5`}>
          <span>View Collections</span>
          <span className="btn-arrow">&#8594;</span>
        </a>
      </div>

    </section>
  );
}
