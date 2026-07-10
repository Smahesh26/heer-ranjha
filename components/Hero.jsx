"use client";
import { useEffect, useState } from "react";
import styles from "./Hero.module.css";

const BG_VARIANTS = ["slide1", "slide2", "slide3"];

function isVideoBanner(banner) {
  if (!banner?.image) return false;
  if (banner.mediaType === "video") return true;
  return /\.(mp4|webm|ogg)$/i.test(banner.image);
}

export default function Hero() {
  const [slides, setSlides] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];
  const isMediaMode = Boolean(activeSlide?.mediaUrl);

  useEffect(() => {
    let isMounted = true;

    async function loadBanners() {
      try {
        const response = await fetch("/api/banners", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        const activeBanners = (data?.banners || [])
          .filter((banner) => banner.active)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

        if (!isMounted) return;

        if (!activeBanners.length) {
          setSlides([]);
          return;
        }

        const mapped = activeBanners.map((banner, index) => ({
          label: `Banner ${index + 1}`,
          title: banner.title || "Heer Ranjha",
          sub: banner.subtitle || "Luxury Indian Couture",
          cta: "Explore",
          ctaHref: banner.link || "/shop",
          bg: BG_VARIANTS[index % BG_VARIANTS.length],
          mediaUrl: banner.image || "",
          mediaType: isVideoBanner(banner) ? "video" : "image",
        }));

        setSlides(mapped);
        setActiveIndex(0);
      } catch {
        // Keep defaults when banner fetch fails.
      }
    }

    loadBanners();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleDotClick = (i) => {
    setActiveIndex(i);
  };

  if (!slides.length) {
    if (process.env.NODE_ENV === "production") {
      return null;
    }

    return (
      <section className={styles.emptyHero} aria-label="Banner status">
        <div className={styles.emptyHeroInner}>
          <p className="eyebrow">Banner Missing</p>
          <h1 className={`display ${styles.emptyHeroTitle}`}>No active backend banner found.</h1>
          <p className={styles.emptyHeroCopy}>Upload an image or MP4 from Admin and keep it marked active to show it on the homepage.</p>
          <a href="/admin/login" className="btn">
            <span>Open Banner Admin</span>
            <span className="btn-arrow">&#8594;</span>
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className={`${styles.hero} ${isMediaMode ? styles.heroMediaMode : ""}`} aria-label="Hero">
      {/* Background slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`${styles.slide} ${styles[slide.bg]} ${i === activeIndex ? styles.active : ""}`}
        >
          {slide.mediaUrl ? (
            <div className={styles.slideMedia}>
              {slide.mediaType === "video" ? (
                <video className={styles.slideVideo} src={slide.mediaUrl} autoPlay muted loop playsInline />
              ) : (
                <img className={styles.slideImage} src={slide.mediaUrl} alt={slide.title} />
              )}
            </div>
          ) : null}
          {/* Grain overlay */}
          <div className={styles.grain} />
          {/* Vignette */}
          <div className={styles.vignette} />
        </div>
      ))}

      {/* Content */}
      <div className={styles.content}>
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`${styles.textSlide} ${i === activeIndex ? styles.active : ""}`}
          >
            <p className={`eyebrow ${styles.eyebrow} ${isMediaMode ? styles.eyebrowMedia : ""}`}>{slide.label}</p>
            <h1 className={`display ${styles.headline}`}>{slide.title}</h1>
            <p className={styles.sub}>{slide.sub}</p>
            <a href={slide.ctaHref} className={`btn ${styles.heroCta} ${isMediaMode ? "btn-ivory" : ""}`}>
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
        {slides.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ""}`}
            onClick={() => handleDotClick(i)}
            aria-label={`Go to slide ${i + 1}`}
            role="tab"
            aria-selected={i === activeIndex}
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
