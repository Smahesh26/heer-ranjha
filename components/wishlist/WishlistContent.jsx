"use client";
import { useEffect, useState } from "react";
import { formatPrice } from "@/components/shop/shopData";
import {
  addGuestCartItem,
  getGuestWishlist,
  removeGuestWishlistItem,
  syncGuestDataToUser,
} from "@/lib/client-cart-wishlist";
import styles from "./wishlist.module.css";

function PageHeader({ itemCount }) {
  const itemLabel = itemCount === 1 ? "item" : "items";

  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderInner}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <a href="/" className={styles.breadcrumbLink}>Home</a>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Wishlist</span>
        </nav>

        <div className={styles.titleRow}>
          <h1 className={`display ${styles.pageTitle}`}>Your Wishlist</h1>
          <span className={styles.countBadge}>{itemCount}</span>
        </div>

        <p className={styles.pageMeta}>{itemCount} {itemLabel} saved</p>
      </div>
    </div>
  );
}

export default function WishlistContent() {
  const [items, setItems] = useState([]);
  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [addedIds, setAddedIds] = useState([]);
  const itemCount = items.length;

  useEffect(() => {
    let active = true;

    async function loadWishlist() {
      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" });
        const loggedIn = meRes.ok;
        if (!active) return;

        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          await syncGuestDataToUser();
          const res = await fetch("/api/wishlist", { cache: "no-store" });
          const data = await res.json().catch(() => ({ items: [] }));
          if (active) setItems(data.items || []);
        } else {
          if (active) setItems(getGuestWishlist());
        }
      } finally {
        if (active) setAuthReady(true);
      }
    }

    void loadWishlist();
    return () => {
      active = false;
    };
  }, []);

  const removeItem = async (item) => {
    if (isLoggedIn) {
      await fetch(`/api/wishlist/${item.id}`, { method: "DELETE" }).catch(() => {});
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
      return;
    }

    removeGuestWishlistItem(item.productId);
    setItems((prev) => prev.filter((entry) => entry.productId !== item.productId));
  };

  const addToCart = async (item) => {
    if (isLoggedIn) {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId, quantity: 1, size: "" }),
      }).catch(() => {});
    } else {
      addGuestCartItem({
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        detail: item.detail,
        collection: item.collection,
        price: item.price,
        image: item.image,
        size: "",
        quantity: 1,
        inStock: item.inStock,
      });
    }

    setAddedIds((prev) => [...prev, item.productId]);
    setTimeout(() => setAddedIds((prev) => prev.filter((i) => i !== item.productId)), 2000);
  };

  const addAllToCart = async () => {
    const inStockItems = items.filter((i) => i.inStock);
    if (isLoggedIn) {
      await Promise.all(
        inStockItems.map((item) =>
          fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: item.productId, quantity: 1, size: "" }),
          }).catch(() => {})
        )
      );
    } else {
      inStockItems.forEach((item) => {
        addGuestCartItem({
          productId: item.productId,
          slug: item.slug,
          name: item.name,
          detail: item.detail,
          collection: item.collection,
          price: item.price,
          image: item.image,
          size: "",
          quantity: 1,
          inStock: item.inStock,
        });
      });
    }

    const inStockIds = inStockItems.map((i) => i.productId);
    setAddedIds(inStockIds);
    setTimeout(() => setAddedIds([]), 2000);
  };

  return (
    <>
      <PageHeader itemCount={itemCount} />

      <div className={styles.wishlistLayout}>
        {!authReady ? (
          <div className={styles.emptyWishlist}>
            <h2 className={`display ${styles.emptyTitle}`}>Loading your wishlist...</h2>
          </div>
        ) : null}

        {authReady && items.length === 0 ? (
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
        ) : authReady ? (
          <>
            <div className={styles.listSummary}>{itemCount} {itemCount === 1 ? "item" : "items"} in wishlist</div>

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
                    const added = addedIds.includes(item.productId);
                    return (
                      <tr key={item.id || item.productId} className={styles.row}>
                        <td className={styles.tdRemove}>
                          <button
                            className={styles.removeBtn}
                            onClick={() => removeItem(item)}
                            aria-label={`Remove ${item.name} from wishlist`}
                          >
                            &times;
                          </button>
                        </td>
                        <td className={styles.tdImage}>
                          <a href={`/product/${(item.slug || item.productId || "").toLowerCase()}`} className={styles.imageLink}>
                            <div className={styles.productThumb}>
                              {item.image ? (
                                <img className={styles.thumbBg} src={item.image} alt={item.name} />
                              ) : (
                                <div className={styles.thumbBg} />
                              )}
                            </div>
                          </a>
                        </td>
                        <td className={styles.tdName}>
                          <a href={`/product/${(item.slug || item.productId || "").toLowerCase()}`} className={`display ${styles.productName}`}>
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
                            onClick={() => item.inStock && addToCart(item)}
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
        ) : null}
      </div>
    </>
  );
}
