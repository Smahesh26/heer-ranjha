"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./about.module.css";

const STATS = [
  { value: 4,    suffix: "",   label: "Curated Collections",   desc: "Nayi Leher, Asaya, Roomani, Ganga Jamuni" },
  { value: 2,    suffix: "",   label: "Boutique Addresses",     desc: "Delhi and Bareilly, North India" },
  { value: 100,  suffix: "+",  label: "Artisan Techniques",     desc: "From hand embroidery to machine zardozi" },
  { value: 500,  suffix: "+",  label: "Pieces Created",         desc: "Across men's and women's collections" },
];

function useCounter(target, active, duration = 1800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration]);

  return count;
}

function StatCard({ stat, active, index }) {
  const count = useCounter(stat.value, active, 1600 + index * 200);

  return (
    <div
      className={`${styles.statCard} reveal`}
      style={{ transitionDelay: `${index * 0.12}s` }}
    >
      <div className={styles.statNum}>
        <span className={`display ${styles.statValue}`}>{count}</span>
        <span className={`display ${styles.statSuffix}`}>{stat.suffix}</span>
      </div>
      <div className={styles.statRule} />
      <h3 className={styles.statLabel}>{stat.label}</h3>
      <p className={styles.statDesc}>{stat.desc}</p>
    </div>
  );
}

export default function StatsRow() {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setActive(true);
            e.target.querySelectorAll(".reveal").forEach((r) => r.classList.add("visible"));
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={styles.stats}>
      <div className={styles.statsHeader}>
        <p className={`eyebrow reveal`}>By the Numbers</p>
        <h2 className={`display ${styles.statsTitle} reveal reveal-delay-1`}>
          The Heer Ranjha <em>Measure</em>
        </h2>
      </div>
      <div className={styles.statsGrid}>
        {STATS.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} active={active} index={i} />
        ))}
      </div>
    </section>
  );
}
