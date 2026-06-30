"use client";
import { useEffect, useRef } from "react";
import styles from "./CraftStory.module.css";

const CRAFT_POINTS = [
  { num: "01", label: "Hand Embroidery", desc: "Each piece is embroidered by master artisans using traditional needlework techniques passed down through generations." },
  { num: "02", label: "Premium Fabrics", desc: "Matka silk, Dupion, Chanderi, and organza, sourced for their texture, drape, and compatibility with fine embroidery." },
  { num: "03", label: "Indian Ethnic", desc: "Rooted in the rich vocabulary of Indian court attire, reimagined for the discerning modern wearer." },
  { num: "04", label: "Indo-Western", desc: "Contemporary silhouettes interpreted through the lens of Indian craft, bridging heritage and today's sensibility." },
];

export default function CraftStory() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.querySelectorAll(".reveal").forEach((el) => {
              el.classList.add("visible");
            });
          }
        });
      },
      { threshold: 0.1 }
    );
    const el = sectionRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      {/* Top full-width statement */}
      <div className={styles.statement}>
        <div className={styles.statementInner}>
          <p className={`eyebrow reveal`} style={{ color: "var(--gold-muted)" }}>Our Craft</p>
          <div className="gold-rule reveal reveal-delay-1" style={{ marginInline: "auto" }} />
          <blockquote className={`display ${styles.quote} reveal reveal-delay-2`}>
            &ldquo;Every thread is an act of devotion. Every stitch, a conversation between maker and cloth.&rdquo;
          </blockquote>
          <p className={`${styles.quoteAttr} reveal reveal-delay-3`}>Heer Ranjha Atelier</p>
        </div>
      </div>

      {/* Four craft pillars */}
      <div className={styles.pillars}>
        {CRAFT_POINTS.map((point, i) => (
          <div
            key={point.num}
            className={`${styles.pillar} reveal`}
            style={{ transitionDelay: `${i * 0.12}s` }}
          >
            <span className={styles.pillarNum}>{point.num}</span>
            <div className={styles.pillarRule} />
            <h3 className={`display ${styles.pillarTitle}`}>{point.label}</h3>
            <p className={styles.pillarDesc}>{point.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA strip */}
      <div className={styles.ctaStrip}>
        <p className={`display ${styles.ctaText} reveal`}>
          Explore the making
        </p>
        <a href="#collections" className={`btn btn-ivory reveal reveal-delay-1`}>
          <span>View Lookbook</span>
          <span className="btn-arrow">&#8594;</span>
        </a>
      </div>
    </section>
  );
}
