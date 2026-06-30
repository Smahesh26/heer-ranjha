"use client";
import { useState } from "react";
import { formatPrice } from "@/components/shop/shopData";
import styles from "./product.module.css";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const REVIEWS = [
  {
    name: "Arjun S.",
    location: "Delhi",
    rating: 5,
    date: "March 2025",
    text: "Wore this to my sister's wedding and received more compliments than the groom. The hand embroidery is exceptionally fine. You can tell real artisans made this. Sizing was accurate.",
  },
  {
    name: "Kabir M.",
    location: "Lucknow",
    rating: 5,
    date: "February 2025",
    text: "The Matka fabric is exactly as described. It has a beautiful texture and the embroidery does not feel heavy. I wore it for six hours at a family function without discomfort. Will order again.",
  },
  {
    name: "Rohan T.",
    location: "Bareilly",
    rating: 4,
    date: "January 2025",
    text: "Quality is genuinely excellent. The colour in person is richer than in photographs. Delivery was prompt and packaging was careful. Took off one star only because I wished there were more size options.",
  },
];

function StarRating({ rating, max = 5, size = 14 }) {
  return (
    <div className={styles.stars} aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i < Math.floor(rating) ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          className={i < rating ? styles.starFilled : styles.starEmpty}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function GalleryView({ product, activeIdx, onSelect }) {
  const views = [
    { cx: product.cx, cy: product.cy },
    { cx: product.cx - 10, cy: product.cy + 8 },
    { cx: product.cx + 12, cy: product.cy - 6 },
    { cx: 50, cy: 50 },
    { cx: product.cx + 5, cy: product.cy + 10 },
  ];

  return (
    <div className={styles.gallery}>
      <div className={styles.galleryMain}>
        <div
          className={styles.galleryMainBg}
          style={{
            background: `radial-gradient(ellipse 75% 75% at ${views[activeIdx].cx}% ${views[activeIdx].cy}%, ${product.colorA}, ${product.colorB})`,
          }}
        />
        {product.badge && (
          <span className={`${styles.badge} ${product.badge === "New" ? styles.badgeNew : styles.badgeSold}`}>
            {product.badge}
          </span>
        )}
      </div>
      <div className={styles.galleryThumbs}>
        {views.map((v, i) => (
          <button
            key={i}
            className={`${styles.thumb} ${i === activeIdx ? styles.thumbActive : ""}`}
            onClick={() => onSelect(i)}
            aria-label={`View ${i + 1}`}
            aria-pressed={i === activeIdx}
          >
            <div
              className={styles.thumbBg}
              style={{
                background: `radial-gradient(ellipse 75% 75% at ${v.cx}% ${v.cy}%, ${product.colorA}, ${product.colorB})`,
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function TabSection({ product }) {
  const [tab, setTab] = useState("description");

  const TABS = [
    { key: "description", label: "Description" },
    { key: "info", label: "Additional Info" },
    { key: "reviews", label: `Reviews (${REVIEWS.length})` },
  ];

  return (
    <div className={styles.tabs}>
      <div className={styles.tabBar} role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`${styles.tabBtn} ${tab === t.key ? styles.tabBtnActive : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent} role="tabpanel">
        {tab === "description" && (
          <div className={styles.descContent}>
            <p className={styles.descPara}>
              The {product.name} is part of our {product.collection} collection, a line that began with a simple question: what does a contemporary Indian man reach for when the occasion demands both presence and ease?
            </p>
            <p className={styles.descPara}>
              The kurta is cut from {product.fabric.toLowerCase()}, chosen for its natural sheen and its willingness to hold fine hand embroidery without distortion. The thread work is done by artisans in our Bareilly atelier using patterns drawn from Mughal geometric motifs, simplified into a language that reads as modern without losing its roots.
            </p>
            <p className={styles.descPara}>
              The set includes a straight-cut kurta and matching cotton pant. Both are pre-washed for softness. The embroidery will not bleed or loosen with careful hand washing.
            </p>
            <ul className={styles.descList}>
              <li>Fabric: {product.fabric}</li>
              <li>Embroidery: {product.detail.split(" · ")[1] || "Hand Embroidery"}</li>
              <li>Set includes: Kurta and cotton pant</li>
              <li>Wash care: Gentle hand wash in cold water, dry in shade</li>
              <li>Country of origin: India</li>
            </ul>
          </div>
        )}

        {tab === "info" && (
          <div className={styles.infoContent}>
            <h3 className={`display ${styles.infoTitle}`}>Size Guide</h3>
            <div className={styles.tableWrap}>
              <table className={styles.sizeTable}>
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest (in)</th>
                    <th>Waist (in)</th>
                    <th>Hip (in)</th>
                    <th>Length (in)</th>
                  </tr>
                </thead>
                <tbody>
                  {[["XS","34","30","35","44"],["S","36","32","37","45"],["M","38","34","39","46"],["L","40","36","41","47"],["XL","42","38","43","48"],["XXL","44","40","45","49"]].map(([sz,...m]) => (
                    <tr key={sz}>
                      <td className={styles.sizeCell}>{sz}</td>
                      {m.map((v,i) => <td key={i}>{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.infoNote}>
              All measurements are in inches. If you are between sizes, we recommend sizing up. For a fitted silhouette, choose your standard size. Contact our boutique for a bespoke fitting appointment.
            </p>
          </div>
        )}

        {tab === "reviews" && (
          <div className={styles.reviewsContent}>
            <div className={styles.reviewsSummary}>
              <div className={styles.reviewsScore}>
                <span className={`display ${styles.reviewsScoreNum}`}>4.7</span>
                <StarRating rating={5} size={18} />
                <span className={styles.reviewsScoreLabel}>{REVIEWS.length} reviews</span>
              </div>
            </div>
            <div className={styles.reviewsList}>
              {REVIEWS.map((r, i) => (
                <div key={i} className={styles.review}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewMeta}>
                      <span className={`display ${styles.reviewName}`}>{r.name}</span>
                      <span className={styles.reviewLocation}>{r.location}</span>
                    </div>
                    <div className={styles.reviewRight}>
                      <StarRating rating={r.rating} size={12} />
                      <span className={styles.reviewDate}>{r.date}</span>
                    </div>
                  </div>
                  <p className={styles.reviewText}>{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RelatedProducts({ products }) {
  if (!products.length) return null;
  return (
    <div className={styles.related}>
      <div className={styles.relatedHeader}>
        <p className="eyebrow">From the Same Collection</p>
        <h2 className={`display ${styles.relatedTitle}`}>
          You May Also Like
        </h2>
      </div>
      <div className={styles.relatedGrid}>
        {products.map((p) => (
          <a key={p.id} href={`/product/${p.id.toLowerCase()}`} className={styles.relatedCard}>
            <div className={styles.relatedImageWrap}>
              <div
                className={styles.relatedBg}
                style={{ background: `radial-gradient(ellipse 75% 75% at ${p.cx}% ${p.cy}%, ${p.colorA}, ${p.colorB})` }}
              />
              <div className={styles.relatedOverlay} />
            </div>
            <p className={styles.relatedCollection}>{p.collection}</p>
            <h3 className={`display ${styles.relatedName}`}>{p.name}</h3>
            <p className={styles.relatedPrice}>{formatPrice(p.price)}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function ProductContent({ product, related }) {
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please select a size.");
      return;
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className={styles.breadcrumbBar}>
        <div className={styles.breadcrumbInner}>
          <a href="/" className={styles.breadcrumbLink}>Home</a>
          <span className={styles.breadcrumbSep}>/</span>
          <a href="/shop" className={styles.breadcrumbLink}>Shop</a>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </div>
      </div>

      {/* Product layout */}
      <div className={styles.productLayout}>
        {/* Left: Gallery */}
        <GalleryView product={product} activeIdx={activeImg} onSelect={setActiveImg} />

        {/* Right: Info */}
        <div className={styles.productInfo}>
          <p className={styles.productCollection}>{product.collection}</p>
          <h1 className={`display ${styles.productName}`}>{product.name}</h1>
          <div className={styles.ratingRow}>
            <StarRating rating={4.7} />
            <span className={styles.ratingCount}>(3 reviews)</span>
          </div>
          <p className={styles.productPrice}>{formatPrice(product.price)}</p>
          <p className={styles.productShortDesc}>
            {product.detail}. A piece from the {product.collection} collection, hand-crafted in {product.fabric.toLowerCase()} by artisans at our Bareilly atelier.
          </p>

          <div className={styles.divider} />

          {/* Size selector */}
          <div className={styles.sizeSection}>
            <div className={styles.sizeLabel}>
              <span className={styles.sizeLabelText}>Size</span>
              {selectedSize && <span className={styles.sizeSelected}>{selectedSize}</span>}
            </div>
            <div className={styles.sizeBtns}>
              {SIZES.map((sz) => (
                <button
                  key={sz}
                  className={`${styles.sizeBtn} ${selectedSize === sz ? styles.sizeBtnActive : ""}`}
                  onClick={() => setSelectedSize(sz)}
                  aria-pressed={selectedSize === sz}
                >
                  {sz}
                </button>
              ))}
            </div>
            <a href="#info" className={styles.sizeGuideLink} onClick={(e) => { e.preventDefault(); }}>
              Size guide
            </a>
          </div>

          {/* Quantity */}
          <div className={styles.qtySection}>
            <span className={styles.qtyLabel}>Quantity</span>
            <div className={styles.qtyStepper}>
              <button
                className={styles.qtyBtn}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                disabled={qty <= 1}
              >
                &#8722;
              </button>
              <span className={styles.qtyValue}>{qty}</span>
              <button
                className={styles.qtyBtn}
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
              >
                &#43;
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className={`${styles.addToCartBtn} ${addedToCart ? styles.addedToCart : ""}`}
              onClick={handleAddToCart}
            >
              {addedToCart ? "Added to Cart" : "Add to Cart"}
            </button>
            <button
              className={`${styles.wishlistBtn} ${wished ? styles.wishlistBtnActive : ""}`}
              onClick={() => setWished((w) => !w)}
              aria-pressed={wished}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wished ? "Wishlisted" : "Add to Wishlist"}
            </button>
          </div>

          <div className={styles.divider} />

          {/* Product meta */}
          <dl className={styles.productMeta}>
            <div className={styles.metaRow}><dt>SKU</dt><dd>{product.id}</dd></div>
            <div className={styles.metaRow}><dt>Category</dt><dd><a href="/shop">{product.subCategory}</a></dd></div>
            <div className={styles.metaRow}><dt>Collection</dt><dd>{product.collection}</dd></div>
            <div className={styles.metaRow}><dt>Fabric</dt><dd>{product.fabric}</dd></div>
          </dl>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsWrapper}>
        <TabSection product={product} />
      </div>

      {/* Related */}
      <div className={styles.relatedWrapper}>
        <RelatedProducts products={related} />
      </div>
    </>
  );
}
