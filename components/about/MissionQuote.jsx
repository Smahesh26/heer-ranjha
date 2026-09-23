"use client";
import { useEffect, useRef } from "react";
import styles from "./about.module.css";

export default function MissionQuote() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.querySelectorAll(".reveal").forEach((r) => r.classList.add("visible")); }),
      { threshold: 0.2 }
    );
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={styles.mission}>
      <div className={styles.missionInner}>
        <p className={`eyebrow reveal`} style={{ color: "var(--gold-muted)", marginBottom: "2rem" }}>
          The Heer Ranjha Experience
        </p>
        <div className={`${styles.missionRule} reveal reveal-delay-1`} />
        <blockquote className={`display ${styles.missionQuote} reveal reveal-delay-2`}>
          &ldquo;Luxury should feel personal. It should remember the wearer, honour the occasion, and carry the quiet confidence of something made with intention.&rdquo;
        </blockquote>
        <cite className={`${styles.missionCite} reveal reveal-delay-3`}>
          Heer Ranjha
        </cite>

        {/* Decorative ornament */}
        <div className={`${styles.missionOrnament} reveal reveal-delay-4`} aria-hidden="true">
          <div className={styles.missionOrnamentRing} />
          <div className={styles.missionOrnamentInner} />
        </div>
      </div>
    </section>
  );
}
