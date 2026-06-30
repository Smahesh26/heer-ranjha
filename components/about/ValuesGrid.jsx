"use client";
import { useEffect, useRef } from "react";
import styles from "./about.module.css";

const VALUES = [
  {
    num: "01",
    icon: "✦",
    title: "Personal First",
    body: "Every design begins with the person wearing it. The goal is not just to create a garment, but to create something that feels like it belongs to them.",
  },
  {
    num: "02",
    icon: "◈",
    title: "Craft with Context",
    body: "We honour Indian craftsmanship without turning it into costume. Heritage informs the work, but contemporary taste shapes the final expression.",
  },
  {
    num: "03",
    icon: "❋",
    title: "Made for Moments",
    body: "Weddings, celebrations, gifting, and occasions that matter are the moments we design for. The pieces are made to be remembered and worn again.",
  },
];

export default function ValuesGrid() {
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
    <section ref={ref} className={styles.values}>
      <div className={styles.valuesHeader}>
        <p className={`eyebrow reveal`}>Our Philosophy</p>
        <div className="gold-rule reveal reveal-delay-1" style={{ marginInline: "auto" }} />
        <h2 className={`display ${styles.valuesTitle} reveal reveal-delay-2`}>
          Three principles we <em>design by</em>
        </h2>
      </div>

      <div className={styles.valuesGrid}>
        {VALUES.map((val, i) => (
          <div
            key={val.num}
            className={`${styles.valueCard} reveal`}
            style={{ transitionDelay: `${i * 0.15}s` }}
          >
            <div className={styles.valueTop}>
              <span className={styles.valueNum}>{val.num}</span>
              <span className={styles.valueIcon} aria-hidden="true">{val.icon}</span>
            </div>
            <div className={styles.valueRule} />
            <h3 className={`display ${styles.valueTitle}`}>{val.title}</h3>
            <p className={styles.valueBody}>{val.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
