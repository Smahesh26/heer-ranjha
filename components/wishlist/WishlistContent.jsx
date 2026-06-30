"use client";
import { useState } from "react";
import { formatPrice } from "@/components/shop/shopData";
import styles from "./wishlist.module.css";

const INITIAL_WISHLIST = [
  {
    id: "AL-1430",
    name: "Red Chanderi Lehenga",
    detail: "Organza Dupatta · Hand Embroidery",
    collection: "Asaya",
    price: 35000,
    inStock: true,
    colorA: "#C03040",
    colorB: "#801020",
  },
  {
    id: "HJM-311",
    name: "Sky Blue Nehru Jacket",
    detail: "Hand Embroidery · Indian Ethnic",
    collection: "Nayi Leher",
    price: 6500,
    inStock: true,
    colorA: "#80B8C8",
    colorB: "#305070",
  },
  {
    id: "AL-1462",
    name: "Ivory Organza Lehenga",
    detail: "3PC Set · Hand Embroidery",
    collection: "Asaya",
    price: 38000,
    inStock: false,
    colorA: "#F0E8D0",
    colorB: "#C8B898",
  },
];

function PageHeader() {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderInner}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <a href="/" className={styles.breadcrumbLink}>Home</a>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Wishlist</span>
        </nav>
        <h1 className={`display ${styles.pageTitle}`}>Your Wishlist</h1>
      </div>
    </div>
  );
}

export default function WishlistContent() {
  const [items, setItems] = useState(INITIAL_WISHLIST);
  const [addedIds, setAddedIds] = useState([]);

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const addToCart = (id) => {
    setAddedIds((prev) => [...prev, id]);
    setTimeout(() => setAddedIds((prev) => prev.filter((i) => i !== id)), 2000);
  };

  const addAllToCart = () => {
    const inStockIds = items.filter((i) => i.inStock).map((i) => i.id);
    setAddedIds(inStockIds);
    setTimeout(() => setAddedIds([]), 2000);
  };

  return (
    <>
      <PageHeader />

      <div className={styles.wishlistLayout}>
        {items.length === 0 ? (
          <div className={styles.emptyWishlist}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2 className={`display ${styles.emptyTitle}`}>Your wishlist is empty</h2>
            <p className={styles.emptySub}>Save pieces you love by clicking the heart on any product.</p>
            <a href="/shop" className="btn">
              <span>Explore the Shop</span>
              <span className="btn-arrow">&#8594;</span>
            </a>
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.wishlistTable}>
                <thead>
                  <tr>
                    <th className={styles.thRemove}></th>
                    <th className={styles.thImage}></th>
                    <th className={styles.thName}>Product</th>
                    <th className={styles.thPrice}>Price</th>
                    <th className={styles.thStock}>Stock</th>
                    <th className={styles.thAction}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const added = addedIds.includes(item.id);
                    return (
                      <tr key={item.id} className={styles.row}>
                        <td className={styles.tdRemove}>
                          <button
                            className={styles.removeBtn}
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.name} from wishlist`}
                          >
                            &times;
                          </button>
                        </td>
                        <td className={styles.tdImage}>
                          <a href={`/product/${item.id.toLowerCase()}`} className={styles.imageLink}>
                            <div className={styles.productThumb}>
                              <div
                                className={styles.thumbBg}
                                style={{
                                  background: `radial-gradient(ellipse 75% 75% at 55% 40%, ${item.colorA}, ${item.colorB})`,
                                }}
                              />
                            </div>
                          </a>
                        </td>
                        <td className={styles.tdName}>
                          <a href={`/product/${item.id.toLowerCase()}`} className={`display ${styles.productName}`}>
                            {item.name}
                          </a>
                          <span className={styles.productDetail}>{item.detail}</span>
                          <span className={styles.productCollection}>{item.collection}</span>
                        </td>
                        <td className={styles.tdPrice}>{formatPrice(item.price)}</td>
                        <td className={styles.tdStock}>
                          <span className={`${styles.stockBadge} ${item.inStock ? styles.inStock : styles.outOfStock}`}>
                            {item.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>
                        <td className={styles.tdAction}>
                          <button
                            className={`${styles.addBtn} ${added ? styles.addBtnAdded : ""} ${!item.inStock ? styles.addBtnDisabled : ""}`}
                            onClick={() => item.inStock && addToCart(item.id)}
                            disabled={!item.inStock}
                            aria-label={`Add ${item.name} to cart`}
                          >
                            {added ? "Added" : item.inStock ? "Add to Cart" : "Unavailable"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.wishlistFooter}>
              <a href="/shop" className={styles.continueLink}>
                Continue Shopping
              </a>
              <button
                className="btn"
                onClick={addAllToCart}
                disabled={!items.some((i) => i.inStock)}
              >
                <span>Add All to Cart</span>
                <span className="btn-arrow">&#8594;</span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
