"use client";
import { useEffect, useRef } from "react";
import styles from "./about.module.css";

const TEAM = [
  {
    name: "Priya Sharma",
    role: "Creative Director",
    bio: "Trained at NIFT Delhi, Priya brings fifteen years of Indian couture experience to every collection. She is the bridge between the artisan and the wearer.",
    color: "#C4A882",
    accent: "#8A7254",
  },
  {
    name: "Ustad Ramzan Ali",
    role: "Master Embroider",
    bio: "A third-generation hand embroidery artisan from Bareilly, Ramzan specialises in zardozi and chikankari. His work defines the signature of each Heer Ranjha piece.",
    color: "#8AA0A8",
    accent: "#4A6070",
  },
  {
    name: "Deepa Nair",
    role: "Head of Design, Women's Wear",
    bio: "Deepa shapes our women's collections, bringing a sensitivity to silhouette and drape that has made our Dupion and Chanderi pieces especially loved.",
    color: "#B89090",
    accent: "#785858",
  },
  {
    name: "Kabir Mehta",
    role: "Head of Design, Men's Wear",
    bio: "Kabir's understanding of the Indian man's relationship with formal occasion wear gives our Sherwanis, Bandhgalas, and Nehru Jackets their quiet authority.",
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
        <p className={`eyebrow reveal`}>The People</p>
        <div className="gold-rule reveal reveal-delay-1" style={{ marginInline: "auto" }} />
        <h2 className={`display ${styles.teamTitle} reveal reveal-delay-2`}>
          Faces Behind the <em>Fabric</em>
        </h2>
        <p className={`${styles.teamSub} reveal reveal-delay-3`}>
          Heer Ranjha is the sum of its people. Designers who dream. Artisans who execute. A team that believes clothing is a serious matter.
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
              <div
                className={styles.teamPortraitBg}
                style={{
                  background: `radial-gradient(ellipse 70% 80% at 45% 35%, ${member.color}, ${member.accent})`,
                }}
              />
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
