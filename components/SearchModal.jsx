"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PRODUCTS, formatPrice } from "@/components/shop/shopData";
import styles from "./SearchModal.module.css";

const POPULAR_SEARCHES = [
  "Kurta Sets",
  "Sherwanis",
  "Lehengas",
  "ASAYA",
  "NAYI LEHER",
  "Matka Silk",
  "Bandhgalas",
];

export default function SearchModal({ isOpen, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  // Auto-focus input when opened & handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filter products matching search query
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return PRODUCTS.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(q);
      const categoryMatch = p.category?.toLowerCase().includes(q);
      const subCatMatch = p.subCategory?.toLowerCase().includes(q);
      const collectionMatch = p.collection?.toLowerCase().includes(q);
      const fabricMatch = p.fabric?.toLowerCase().includes(q);
      const descMatch = p.description?.toLowerCase().includes(q);
      return (
        nameMatch ||
        categoryMatch ||
        subCatMatch ||
        collectionMatch ||
        fabricMatch ||
        descMatch
      );
    }).slice(0, 6);
  }, [query]);

  const totalMatchesCount = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return 0;
    return PRODUCTS.filter((p) => {
      return (
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.subCategory?.toLowerCase().includes(q) ||
        p.collection?.toLowerCase().includes(q) ||
        p.fabric?.toLowerCase().includes(q)
      );
    }).length;
  }, [query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    router.push(`/shop?q=${encodeURIComponent(query.trim())}#shop-layout`);
  };

  const handleSelectProduct = (slug) => {
    onClose();
    const normalizedSlug = String(slug).trim().toLowerCase().replace(/^\/+/, "");
    router.push(`/product/${normalizedSlug}`);
  };

  const handleSelectTag = (tag) => {
    setQuery(tag);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Search catalog"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Search header */}
        <div className={styles.header}>
          <form className={styles.form} onSubmit={handleSearchSubmit}>
            <svg
              className={styles.searchIcon}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              placeholder="Search collections, Kurtas, Sherwanis, fabrics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => setQuery("")}
                aria-label="Clear search input"
              >
                &times;
              </button>
            )}
          </form>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close search"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content body */}
        <div className={styles.body}>
          {/* Quick tags when query is empty */}
          {!query.trim() && (
            <div className={styles.popularWrap}>
              <span className={styles.sectionLabel}>Popular Searches</span>
              <div className={styles.tags}>
                {POPULAR_SEARCHES.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={styles.tag}
                    onClick={() => handleSelectTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results list */}
          {query.trim() !== "" && (
            <div className={styles.resultsWrap}>
              <div className={styles.resultsHeader}>
                <span className={styles.sectionLabel}>
                  {totalMatchesCount > 0
                    ? `Matching Pieces (${totalMatchesCount})`
                    : "No matching pieces"}
                </span>
              </div>

              {results.length > 0 ? (
                <div className={styles.grid}>
                  {results.map((product) => {
                    const previewImg =
                      Array.isArray(product.images) && product.images[0];
                    return (
                      <div
                        key={product.id}
                        className={styles.productCard}
                        onClick={() =>
                          handleSelectProduct(product.slug || product.id)
                        }
                      >
                        <div className={styles.imgWrap}>
                          {previewImg ? (
                            <img
                              src={previewImg}
                              alt={product.name}
                              className={styles.img}
                            />
                          ) : (
                            <div className={styles.imgFallback} />
                          )}
                        </div>
                        <div className={styles.info}>
                          <span className={styles.category}>
                            {product.collection || product.category}
                          </span>
                          <h4 className={styles.title}>{product.name}</h4>
                          <span className={styles.price}>
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No outfits found matching &ldquo;{query}&rdquo;.</p>
                  <p className={styles.emptySub}>
                    Try searching with broader terms or choose a popular search:
                  </p>
                  <div className={styles.tags} style={{ marginTop: "1rem" }}>
                    {POPULAR_SEARCHES.slice(0, 4).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={styles.tag}
                        onClick={() => handleSelectTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {totalMatchesCount > 0 && (
                <button
                  className={styles.viewAllBtn}
                  onClick={handleSearchSubmit}
                >
                  View all {totalMatchesCount} result
                  {totalMatchesCount !== 1 ? "s" : ""} in Shop &rarr;
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
