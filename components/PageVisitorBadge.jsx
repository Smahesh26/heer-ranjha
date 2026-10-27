"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./PageVisitorBadge.module.css";

export default function PageVisitorBadge() {
  const pathname = usePathname();
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!pathname) return;

    let isMounted = true;
    const sessionKey = `hr_viewed_${pathname}`;
    const alreadyCountedInSession = typeof window !== "undefined" && Boolean(sessionStorage.getItem(sessionKey));

    async function recordAndFetchViews() {
      try {
        const res = await fetch("/api/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: pathname,
            increment: !alreadyCountedInSession,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data?.views === "number") {
            setCount(data.views);
            if (!alreadyCountedInSession && typeof window !== "undefined") {
              sessionStorage.setItem(sessionKey, "1");
            }
          }
        }
      } catch (err) {
        // Fallback gracefully without breaking UI
      }
    }

    recordAndFetchViews();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  if (count === null) {
    return (
      <div className={styles.badgeWrap} title="Live page visitors">
        <span className={styles.pulseDot} aria-hidden="true" />
        <span className={styles.viewCount}>Counting visitors...</span>
      </div>
    );
  }

  return (
    <div className={styles.badgeWrap} title={`Total visitors who viewed this page: ${count.toLocaleString("en-IN")}`}>
      <span className={styles.pulseDot} aria-hidden="true" />
      <span className={styles.viewIcon} aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </span>
      <span className={styles.viewCount}>
        {count.toLocaleString("en-IN")} people saw this page
      </span>
    </div>
  );
}
