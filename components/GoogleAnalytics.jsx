"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function GoogleAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || typeof window === "undefined" || typeof window.gtag !== "function") return;

    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    // Send page_view event on client-side route navigation
    window.gtag("config", "G-44NJQWNPXC", {
      page_path: url,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
