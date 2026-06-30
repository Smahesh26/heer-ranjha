"use client";
import { useEffect, useRef } from "react";
import styles from "./about.module.css";

const TESTIMONIALS = [
  {
    quote: "I wore their Matka silk Kurta to my brother&#39;s wedding in Lucknow. Three days later I was still getting messages asking where it was from. The embroidery work is unlike anything available in a boutique at this price.",
    name: "Arjun S.",
    location: "Delhi",
    collection: "Nayi Leher",
  },
  {
    quote: "The Dupion Co-ord Set I bought for Diwali is still the most commented-on piece in my wardrobe, two seasons later. It holds its shape, holds its colour, and holds its story. That&#39;s what good craft does.",
    name: "Preethi M.",
    location: "Mumbai",
    collection: "Asaya",
  },
  {
    quote: "I was specific about what I wanted for my reception: a Bandhgala that felt like me, not like a costume. The team in Delhi listened carefully and delivered something I will genuinely pass on to my son someday.",
    name: "Rahul K.",
    location: "Bareilly",
    collection: "Nayi Leher",
  },
];

export default function Testimonials() {
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
    <section ref={ref} className={styles.testimonials}>
      <div className={styles.testimonialsHeader}>
        <p className={`eyebrow reveal`}>What People Say</p>
        <div className="gold-rule reveal reveal-delay-1" style={{ marginInline: "auto" }} />
        <h2 className={`display ${styles.testimonialsTitle} reveal reveal-delay-2`}>
          Voices from <em>Our Wearers</em>
        </h2>
      </div>

      <div className={styles.testimonialsGrid}>
        {TESTIMONIALS.map((t, i) => (
          <div
            key={i}
            className={`${styles.testimonialCard} reveal`}
            style={{ transitionDelay: `${i * 0.15}s` }}
          >
            {/* Opening mark */}
            <div className={`display ${styles.testimonialMark}`} aria-hidden="true">&ldquo;</div>

            <p className={styles.testimonialQuote} dangerouslySetInnerHTML={{ __html: t.quote }} />

            <div className={styles.testimonialFooter}>
              <div className={styles.testimonialAuthor}>
                <span className={styles.testimonialName}>{t.name}</span>
                <span className={styles.testimonialSep}>·</span>
                <span className={styles.testimonialLocation}>{t.location}</span>
              </div>
              <span className={styles.testimonialCollection}>{t.collection}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
