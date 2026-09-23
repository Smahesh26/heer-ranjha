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
          <div className={styles.storyImageCardPrimary}>
            <img className={styles.storyImagePhoto} src="/image1.jpeg" alt="Heer Ranjha brand visual 1" />
          </div>
          <div className={styles.storyImageCardSecondary}>
            <img className={styles.storyImagePhoto} src="/image2.jpeg" alt="Heer Ranjha brand visual 2" />
          </div>
          <div className={styles.storyImageOverlay} />
          {/* Floating label */}
          <div className={styles.storyImageLabel}>
            <p className="eyebrow" style={{ color: "var(--warm-white)", opacity: 0.7 }}>The Heer Ranjha Experience</p>
            <p className={styles.storyImageLabelText}>Images from the brand story</p>
          </div>
          {/* Corner ornaments */}
          <div className={`${styles.corner} ${styles.cornerTL}`} />
          <div className={`${styles.corner} ${styles.cornerBR}`} />
        </div>
      </div>

      {/* Text panel */}
      <div className={styles.storyText}>
        <p className={`eyebrow reveal`}>The Heer Ranjha Experience</p>
        <div className="gold-rule reveal reveal-delay-1" />
        <h2 className={`display ${styles.storyTitle} reveal reveal-delay-2`}>
          Designed with care.<br />
          <em>Worn with confidence.</em>
        </h2>
        <p className={`${styles.storyBody} reveal reveal-delay-3`}>
          The experience begins with a conversation. We listen to the occasion, the personality, and the feeling the client wants to carry. From there, silhouettes, fabrics, and embellishments are curated into a result that feels individual.
        </p>
        <p className={`${styles.storyBody} reveal reveal-delay-4`}>
          Whether it is a single statement piece or a complete wardrobe for a celebration, the goal is the same: to create clothing that feels personal, refined, and unmistakably Heer Ranjha.
        </p>

        {/* Story details */}
        <div className={`${styles.storyDetails} reveal reveal-delay-4`}>
          <div className={styles.storyDetail}>
            <span className={`display ${styles.storyDetailNum}`}>01</span>
            <span className={styles.storyDetailLabel}>Discovery</span>
          </div>
          <div className={styles.storyDetailDivider} />
          <div className={styles.storyDetail}>
            <span className={`display ${styles.storyDetailNum}`}>02</span>
            <span className={styles.storyDetailLabel}>Design</span>
          </div>
          <div className={styles.storyDetailDivider} />
          <div className={styles.storyDetail}>
            <span className={`display ${styles.storyDetailNum}`}>03</span>
            <span className={styles.storyDetailLabel}>Finish</span>
          </div>
        </div>

        <a href="/" className={`btn reveal reveal-delay-5`}>
          <span>Explore the Shop</span>
          <span className="btn-arrow">&#8594;</span>
        </a>
      </div>

    </section>
  );
}
