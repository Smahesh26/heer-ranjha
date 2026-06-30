"use client";
import { useEffect, useRef } from "react";
import styles from "./about.module.css";

const TEAM = [
  {
    name: "Ayush Sethi",
    role: "Curator & Brand Director",
    bio: "Ayush shapes the brand narrative, client experience, and overall direction, ensuring Heer Ranjha remains intimate, modern, and rooted in craft.",
    color: "#C4A882",
    accent: "#8A7254",
    image: "/image1.jpeg",
  },
  {
    name: "Ragini Sethi",
    role: "Head Designer",
    bio: "Ragini leads the design language of the house, translating heritage references into silhouettes and finishes that feel current, polished, and personal.",
    color: "#8AA0A8",
    accent: "#4A6070",
    image: "/image2.jpeg",
  },
  {
    name: "The Atelier Team",
    role: "Pattern, Embroidery & Finishing",
    bio: "A closely coordinated group of specialists who bring each piece to life with precision, patience, and a strong respect for the final wearer.",
    color: "#B89090",
    accent: "#785858",
  },
  {
    name: "Heritage Craftspeople",
    role: "Hand Embroidery & Finishing",
    bio: "The work is ultimately defined by skilled hands that respect detail, balance, and the quiet discipline behind luxury clothing.",
    color: "#8A9880",
    accent: "#506048",
  },
];

export default function AtelierTeam() {
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
    <section ref={ref} className={styles.team}>
      <div className={styles.teamHeader}>
        <p className={`eyebrow reveal`}>The People Behind the Brand</p>
        <div className="gold-rule reveal reveal-delay-1" style={{ marginInline: "auto" }} />
        <h2 className={`display ${styles.teamTitle} reveal reveal-delay-2`}>
          Leadership with <em>personal vision</em>
        </h2>
        <p className={`${styles.teamSub} reveal reveal-delay-3`}>
          Heer Ranjha is led by people who treat clothing as a form of personal expression. The brand stays focused because the vision stays clear.
        </p>
      </div>

      <div className={styles.teamGrid}>
        {TEAM.map((member, i) => (
          <div
            key={member.name}
            className={`${styles.teamCard} reveal`}
            style={{ transitionDelay: `${i * 0.12}s` }}
          >
            {/* Portrait placeholder */}
            <div className={styles.teamPortrait}>
              {member.image ? (
                <img className={styles.teamPortraitPhoto} src={member.image} alt={member.name} />
              ) : (
                <div
                  className={styles.teamPortraitBg}
                  style={{
                    background: `radial-gradient(ellipse 70% 80% at 45% 35%, ${member.color}, ${member.accent})`,
                  }}
                />
              )}
              <div className={styles.teamPortraitOverlay} />
              {/* Initials */}
              <div className={styles.teamInitials}>
                <span className={`display ${styles.teamInitialsText}`}>
                  {member.name.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
            </div>

            {/* Member info */}
            <div className={styles.teamInfo}>
              <h3 className={`display ${styles.teamName}`}>{member.name}</h3>
              <p className={styles.teamRole}>{member.role}</p>
              <div className={styles.teamBioRule} />
              <p className={styles.teamBio} dangerouslySetInnerHTML={{ __html: member.bio }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
