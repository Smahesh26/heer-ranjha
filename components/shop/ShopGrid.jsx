"use client";
import { useState } from "react";
import { formatPrice } from "./shopData";
import styles from "./shop.module.css";

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product }) {
  const [wished, setWished] = useState(false);

  const normalizedSlug = String(product.slug || product.id || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "");

  const previewImage = Array.isArray(product.images) ? product.images[0] : null;
  const badge = product.stock <= 0 ? "Sold Out" : product.featured ? "New" : null;
  const detailText = product.detail || product.description || "";
  const productHref = `/product/${normalizedSlug}`;

  const bgStyle = {
    background: `radial-gradient(ellipse 75% 75% at ${product.cx || 50}% ${product.cy || 50}%, ${product.colorA || "#d4c2a3"}, ${product.colorB || "#7a5635"})`,
  };

  return (
    <article className={styles.card}>
      {/* Image area */}
      <div className={styles.cardImageWrap}>
        {previewImage ? (
          <img className={styles.cardImage} src={previewImage} alt={product.name} loading="lazy" />
        ) : (
          <div className={styles.cardBg} style={bgStyle} />
        )}
        <div className={styles.cardOverlay} />

        {/* Badge */}
        {badge && (
          <span
            className={`${styles.badge} ${
              badge === "Sold Out"
                ? styles.badgeSold
                : badge === "New"
                ? styles.badgeNew
                : styles.badgeSale
            }`}
          >
            {badge}
          </span>
        )}

        {/* Wishlist button */}
        <button
          className={`${styles.wishBtn} ${wished ? styles.wishBtnActive : ""}`}
          onClick={() => setWished((w) => !w)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Hover: view button */}
        <div className={styles.cardHoverActions}>
          <a href={productHref} className={styles.viewPieceBtn}>
            View Piece
          </a>
        </div>
      </div>

      {/* Card info */}
      <div className={styles.cardInfo}>
        <p className={styles.cardCollection}>{product.collection}</p>
        <h3 className={`display ${styles.cardName}`}>{product.name}</h3>
        <p className={styles.cardDetail}>{detailText}</p>
        <p className={styles.cardPrice}>{formatPrice(product.price)}</p>
      </div>
    </article>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  return (
    <nav className={styles.pagination} aria-label="Page navigation">
      <button
        className={`${styles.pageBtn} ${styles.pageBtnArrow}`}
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        &#8592;
      </button>

      {pages.map((p) => (
        <button
          key={p}
          className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
          onClick={() => onPage(p)}
          aria-label={`Page ${p}`}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}

      <button
        className={`${styles.pageBtn} ${styles.pageBtnArrow}`}
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        &#8594;
      </button>
    </nav>
  );
}

// ── ShopGrid ──────────────────────────────────────────────────────────────────
export default function ShopGrid({
  products,
  total,
  loading,
  page,
  totalPages,
  perPage,
  sort,
  sortOptions,
  onSort,
  onPage,
}) {
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  return (
    <div className={styles.gridArea}>
      {/* Sort bar */}
      <div className={styles.sortBar}>
        <p className={styles.resultCount}>
          {loading
            ? "Loading pieces..."
            : total === 0
            ? "No pieces found"
            : `Showing ${start} to ${end} of ${total} piece${total !== 1 ? "s" : ""}`}
        </p>

        <div className={styles.sortWrap}>
          <label className={styles.sortLabel} htmlFor="shop-sort">Sort by</label>
          <select
            id="shop-sort"
            className={styles.sortSelect}
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            aria-label="Sort products"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {!loading && products.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={`display ${styles.emptyTitle}`}>No pieces found</p>
          <p className={styles.emptySub}>Try adjusting your filters to see more results.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPage={onPage} />
    </div>
  );
}
