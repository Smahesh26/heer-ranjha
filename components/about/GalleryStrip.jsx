"use client";
import { useEffect, useRef } from "react";
import styles from "./about.module.css";

const GALLERY = [
  { label: "Mood", color: "#D4A090", accent: "#8A5040" },
  { label: "Texture", color: "#8AA8C4", accent: "#2A608A" },
  { label: "Silhouette", color: "#C090A0", accent: "#785060" },
  { label: "Detail", color: "#A0B890", accent: "#506040" },
  { label: "Finish", color: "#9090C0", accent: "#404080" },
  { label: "Signature", color: "#C0A870", accent: "#806030" },
];

export default function GalleryStrip() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.querySelectorAll(".reveal").forEach((r) => r.classList.add("visible")); }),
      { threshold: 0.05 }
    );
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={styles.gallery}>
      <div className={styles.galleryHeader}>
        <p className={`eyebrow reveal`}>From the Archive</p>
        <h2 className={`display ${styles.galleryTitle} reveal reveal-delay-1`}>
          Visual notes from <em>the brand story</em>
        </h2>
      </div>

      <div className={styles.galleryGrid}>
        {GALLERY.map((item, i) => (
          <div
            key={i}
            className={`${styles.galleryCell} reveal`}
            style={{ transitionDelay: `${i * 0.08}s` }}
          >
            <div
              className={styles.galleryCellBg}
              style={{
                background: `radial-gradient(ellipse 80% 80% at ${[40, 60, 35, 65, 45, 55][i]}% ${[40, 35, 60, 45, 55, 40][i]}%, ${item.color}, ${item.accent})`,
              }}
            />
            <div className={styles.galleryCellOverlay} />
            <div className={styles.galleryCellLabel}>
              <span className="eyebrow" style={{ color: "rgba(245,240,230,0.8)", fontSize: "0.55rem" }}>
                {item.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
