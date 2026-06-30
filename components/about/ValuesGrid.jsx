"use client";
import { useEffect, useRef } from "react";
import styles from "./about.module.css";

const VALUES = [
  {
    num: "01",
    icon: "✦",
    title: "Craft Before Commerce",
    body: "We make what we believe in, not what we think will sell fastest. Every collection is designed with an internal standard: would an artisan be proud of this? If yes, it ships. If not, it goes back.",
  },
  {
    num: "02",
    icon: "◈",
    title: "Heritage, Honestly",
    body: "We draw from India's textile traditions without costume-ising them. Our embroidery references Mughal motifs, folk geometry, and chikankari, but through a vocabulary that belongs to today. Reverence without replica.",
  },
  {
    num: "03",
    icon: "❋",
    title: "Clothes for Real Occasions",
    body: "A wedding in Lucknow. A reception in Delhi. A festival lunch in Bareilly. These are our occasions. We make clothes that live in those moments, that earn a second wear, and a third, that become part of a family story.",
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
        <p className={`eyebrow reveal`}>What We Stand For</p>
        <div className="gold-rule reveal reveal-delay-1" style={{ marginInline: "auto" }} />
        <h2 className={`display ${styles.valuesTitle} reveal reveal-delay-2`}>
          Three Things We <em>Never Compromise</em>
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
