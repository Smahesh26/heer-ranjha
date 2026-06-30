"use client";
import { useEffect, useRef } from "react";
import styles from "./Hero.module.css";

const SLIDES = [
  {
    label: "New Collection",
    headline: ["Where", "Craft", "Meets"],
    accent: "Couture",
    sub: "Nayi Leher , Now Available",
    cta: "Explore Collection",
    ctaHref: "#collections",
    bg: "slide1",
  },
  {
    label: "Men's Wear",
    headline: ["Adorned", "in"],
    accent: "Heritage",
    sub: "Hand-embroidered Kurtas, Sherwanis and Nehru Jackets",
    cta: "Shop Men",
    ctaHref: "#men",
    bg: "slide2",
  },
  {
    label: "Women's Wear",
    headline: ["Draped", "in"],
    accent: "Elegance",
    sub: "Lehengas, Suit Sets and Co-ord Sets , crafted for every occasion",
    cta: "Shop Women",
    ctaHref: "#women",
    bg: "slide3",
  },
];

export default function Hero() {
  const slideIndexRef = useRef(0);
  const slidesRef = useRef([]);
  const dotsRef = useRef([]);
  const timerRef = useRef(null);

  const goTo = (index) => {
    const prev = slideIndexRef.current;
    slidesRef.current[prev]?.classList.remove(styles.active);
    dotsRef.current[prev]?.classList.remove(styles.dotActive);

    slideIndexRef.current = index;
    slidesRef.current[index]?.classList.add(styles.active);
    dotsRef.current[index]?.classList.add(styles.dotActive);
  };

  useEffect(() => {
    goTo(0);
    timerRef.current = setInterval(() => {
      goTo((slideIndexRef.current + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleDotClick = (i) => {
    clearInterval(timerRef.current);
    goTo(i);
    timerRef.current = setInterval(() => {
      goTo((slideIndexRef.current + 1) % SLIDES.length);
    }, 6000);
  };

  return (
    <section className={styles.hero} aria-label="Hero">
      {/* Background slides */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          ref={(el) => (slidesRef.current[i] = el)}
          className={`${styles.slide} ${styles[slide.bg]}`}
        >
          {/* Grain overlay */}
          <div className={styles.grain} />
          {/* Vignette */}
          <div className={styles.vignette} />
        </div>
      ))}

      {/* Content */}
      <div className={styles.content}>
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            ref={(el) => (slidesRef.current[i + SLIDES.length] = el)}
            className={`${styles.textSlide} ${i === 0 ? styles.active : ""}`}
          >
            <p className={`eyebrow ${styles.eyebrow}`}>{slide.label}</p>
            <h1 className={`display ${styles.headline}`}>
              {slide.headline.map((word, wi) => (
                <span key={wi} className={styles.word}>
                  {word}
                  <br />
                </span>
              ))}
              <em className={styles.accentWord}>{slide.accent}</em>
            </h1>
            <p className={styles.sub}>{slide.sub}</p>
            <a href={slide.ctaHref} className={`btn ${styles.heroCta}`}>
              <span>{slide.cta}</span>
              <span className="btn-arrow">&#8594;</span>
            </a>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollIndicator} aria-hidden="true">
        <span className={styles.scrollText}>Scroll</span>
        <div className={styles.scrollLine} />
      </div>

      {/* Slide dots */}
      <div className={styles.dots} role="tablist" aria-label="Hero slides">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            ref={(el) => (dotsRef.current[i] = el)}
            className={styles.dot}
            onClick={() => handleDotClick(i)}
            aria-label={`Go to slide ${i + 1}`}
            role="tab"
          />
        ))}
      </div>

      {/* Bottom strip */}
      <div className={styles.bottomStrip}>
        <span className="eyebrow">Est. Delhi &amp; Bareilly</span>
        <div className={styles.stripRule} />
        <span className="eyebrow">Heer Ranjha</span>
      </div>
    </section>
  );
}
