"use client";
import { useEffect, useRef } from "react";
import styles from "./about.module.css";

export default function AboutCTA() {
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
    <section ref={ref} className={styles.cta}>
      {/* Background texture blobs */}
      <div className={styles.ctaBlobA} aria-hidden="true" />
      <div className={styles.ctaBlobB} aria-hidden="true" />
      <div className={styles.ctaOverlay} aria-hidden="true" />

      <div className={styles.ctaInner}>
        <p className={`eyebrow reveal`} style={{ color: "rgba(245,240,230,0.6)" }}>
          Continue Exploring
        </p>
        <h2 className={`display ${styles.ctaTitle} reveal reveal-delay-1`}>
          Discover the collection<br />
          <em>and the craft behind it</em>
        </h2>
        <p className={`${styles.ctaBody} reveal reveal-delay-2`}>
          Explore the shop or reach out to discuss something personal. Heer Ranjha is built to create clothing that feels meaningful from the first conversation to the final fitting.
        </p>

        <div className={`${styles.ctaLocations} reveal reveal-delay-3`}>
          <div className={styles.ctaLocation}>
            <p className={`eyebrow`} style={{ color: "var(--gold)" }}>Brand Director</p>
            <p className={styles.ctaLocationAddr}>Ayush Sethi</p>
          </div>
          <div className={styles.ctaLocationSep} aria-hidden="true" />
          <div className={styles.ctaLocation}>
            <p className={`eyebrow`} style={{ color: "var(--gold)" }}>Head Designer</p>
            <p className={styles.ctaLocationAddr}>Ragini Sethi</p>
          </div>
        </div>

        <div className={`${styles.ctaButtons} reveal reveal-delay-4`}>
          <a href="/" className="btn btn-ivory">
            <span>Explore Collections</span>
            <span className="btn-arrow">&#8594;</span>
          </a>
          <a href="mailto:hello@heerranjha.com" className={`btn ${styles.ctaBtnOutline}`}>
            <span>Book an Appointment</span>
            <span className="btn-arrow">&#8594;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
