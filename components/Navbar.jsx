"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./Navbar.module.css";

const navLinks = [
  { label: "Collections", href: "/#collections" },
  { label: "Men", href: "/#men" },
  { label: "Women", href: "/#women" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about-us" },
  { label: "Stores", href: "/#stores" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.inner}>
          {/* Left links */}
          <nav className={`${styles.navLinks} ${styles.navLeft}`} aria-label="Primary navigation left">
            {navLinks.slice(0, 3).map((link) => (
              <a key={link.label} href={link.href} className={styles.navLink}>
                {link.label}
              </a>
            ))}
          </nav>

          {/* Logo */}
          <a href="/" className={styles.logoWrap} aria-label="Heer Ranjha Home">
            <Image
              src="/logo.png"
              alt="Heer Ranjha"
              width={64}
              height={80}
              className={styles.logoImg}
              priority
            />
          </a>

          {/* Right links */}
          <nav className={`${styles.navLinks} ${styles.navRight}`} aria-label="Primary navigation right">
            {navLinks.slice(3).map((link) => (
              <a key={link.label} href={link.href} className={styles.navLink}>
                {link.label}
              </a>
            ))}
            <button className={styles.iconBtn} aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </button>
            <a href="/wishlist" className={styles.iconBtn} aria-label="Wishlist">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </a>
            <a href="/cart" className={styles.iconBtn} aria-label="Cart">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round"/>
                <path d="M16 10a4 4 0 0 1-8 0" strokeLinecap="round"/>
              </svg>
            </a>
            <a href="/my-account" className={styles.iconBtn} aria-label="My Account">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </a>
          </nav>

          {/* Hamburger (mobile) */}
          <button
            className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`} aria-hidden={!menuOpen}>
        <nav className={styles.mobileNav}>
          {navLinks.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              className={styles.mobileLink}
              style={{ transitionDelay: menuOpen ? `${i * 0.07 + 0.15}s` : "0s" }}
              onClick={() => setMenuOpen(false)}
            >
              <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.mobileLinkText}>{link.label}</span>
            </a>
          ))}
        </nav>
        <div className={styles.mobileFooter}>
          <p className="eyebrow">Delhi &nbsp;&nbsp;|&nbsp;&nbsp; Bareilly</p>
        </div>
      </div>
    </>
  );
}
