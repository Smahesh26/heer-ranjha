"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./Newsletter.module.css";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | success | error
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
          }
        });
      },
      { threshold: 0.2 }
    );
    const el = sectionRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }
    setStatus("success");
    setEmail("");
  };

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.textCol}>
          <p className="eyebrow reveal">Stay in the loop</p>
          <div className="gold-rule reveal reveal-delay-1" />
          <h2 className={`display ${styles.title} reveal reveal-delay-2`}>
            The Heer Ranjha<br />
            <em>Dispatch</em>
          </h2>
          <p className={`${styles.sub} reveal reveal-delay-3`}>
            Collection launches, lookbook releases, and notes from the atelier, delivered to your inbox.
          </p>
        </div>

        <div className={`${styles.formCol} reveal reveal-delay-2`}>
          {status === "success" ? (
            <div className={styles.success}>
              <div className={styles.successIcon}>&#10003;</div>
              <p className={`display ${styles.successText}`}>Thank you for subscribing.</p>
              <p className={styles.successSub}>You will hear from us soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.inputWrap}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
                  placeholder="Your email address"
                  className={`${styles.input} ${status === "error" ? styles.inputError : ""}`}
                  aria-label="Email address"
                />
              </div>
              {status === "error" && (
                <p className={styles.errorMsg}>Please enter a valid email address.</p>
              )}
              <button type="submit" className={`btn ${styles.submitBtn}`}>
                <span>Subscribe</span>
                <span className="btn-arrow">&#8594;</span>
              </button>
              <p className={styles.disclaimer}>No spam. Unsubscribe at any time.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
