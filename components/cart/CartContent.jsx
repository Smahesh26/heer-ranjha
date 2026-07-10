"use client";
import { useEffect, useState } from "react";
import { formatPrice } from "@/components/shop/shopData";
import {
  getGuestCart,
  removeGuestCartItem,
  syncGuestDataToUser,
  updateGuestCartQuantity,
} from "@/lib/client-cart-wishlist";
import styles from "./cart.module.css";

function fallbackCardStyle(id) {
  const code = String(id || "X")
    .split("")
    .reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const a = 40 + (code % 120);
  const b = 20 + (code % 80);
  return {
    background: `radial-gradient(ellipse 75% 75% at 55% 40%, hsl(${a} 45% 68%), hsl(${b} 45% 42%))`,
  };
}

function PageHeader({ itemCount, totalQty }) {
  const itemLabel = itemCount === 1 ? "item" : "items";
  const qtyLabel = totalQty === 1 ? "piece" : "pieces";

  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderInner}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <a href="/" className={styles.breadcrumbLink}>Home</a>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Cart</span>
        </nav>

        <div className={styles.titleRow}>
          <h1 className={`display ${styles.pageTitle}`}>Your Cart</h1>
          <span className={styles.countBadge}>{itemCount}</span>
        </div>

        <p className={styles.pageMeta}>{itemCount} {itemLabel} in cart · {totalQty} {qtyLabel}</p>
      </div>
    </div>
  );
}

export default function CartContent() {
  const [items, setItems] = useState([]);
  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCart() {
      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" });
        const loggedIn = meRes.ok;
        if (!active) return;

        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          await syncGuestDataToUser();
          const cartRes = await fetch("/api/cart", { cache: "no-store" });
          const cartData = await cartRes.json().catch(() => ({ items: [] }));
          if (active) {
            setItems((cartData.items || []).map((item) => ({ ...item, qty: item.quantity })));
          }
        } else {
          const guestItems = getGuestCart().map((item) => ({
            ...item,
            id: `${item.productId}::${item.size || ""}`,
            qty: item.quantity,
            unitPrice: Number(item.price || 0),
          }));
          if (active) {
            setItems(guestItems);
          }
        }
      } finally {
        if (active) {
          setAuthReady(true);
        }
      }
    }

    void loadCart();
    return () => {
      active = false;
    };
  }, []);

  const updateQty = async (item, delta) => {
    const nextQty = Math.max(1, Number(item.qty || 1) + delta);

    if (isLoggedIn) {
      await fetch(`/api/cart/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: nextQty }),
      }).catch(() => {});
      setItems((prev) =>
        prev.map((entry) => (entry.id === item.id ? { ...entry, qty: nextQty, quantity: nextQty } : entry))
      );
      return;
    }

    updateGuestCartQuantity(item.productId, item.size, nextQty);
    setItems((prev) =>
      prev.map((entry) =>
        entry.productId === item.productId && String(entry.size || "") === String(item.size || "")
          ? { ...entry, qty: nextQty, quantity: nextQty }
          : entry
      )
    );
  };

  const removeItem = async (item) => {
    if (isLoggedIn) {
      await fetch(`/api/cart/${item.id}`, { method: "DELETE" }).catch(() => {});
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
      return;
    }

    removeGuestCartItem(item.productId, item.size);
    setItems((prev) =>
      prev.filter(
        (entry) => !(entry.productId === item.productId && String(entry.size || "") === String(item.size || ""))
      )
    );
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice || item.price || 0) * Number(item.qty || 1), 0);
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;
  const itemCount = items.length;
  const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 1), 0);

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === "HEER10") {
      setCouponApplied(true);
      setCouponError("");
    } else {
      setCouponError("Invalid coupon code. Try HEER10 for 10% off.");
      setCouponApplied(false);
    }
  };

  return (
    <>
      <PageHeader itemCount={itemCount} totalQty={totalQty} />

      <div className={styles.cartLayout}>
        {!authReady ? (
          <div className={styles.emptyCart}>
            <h2 className={`display ${styles.emptyTitle}`}>Loading your cart...</h2>
          </div>
        ) : null}

        {authReady && items.length === 0 ? (
          <div className={styles.emptyCart}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round"/>
                <path d="M16 10a4 4 0 0 1-8 0" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className={`display ${styles.emptyTitle}`}>Your cart is empty</h2>
            <p className={styles.emptySub}>Discover our collections and find something you love.</p>
            <a href="/shop" className="btn">
              <span>Return to Shop</span>
              <span className="btn-arrow">&#8594;</span>
            </a>
          </div>
        ) : authReady ? (
          <div className={styles.cartMain}>
            <div className={styles.listSummary}>{itemCount} {itemCount === 1 ? "item" : "items"} selected</div>

            {/* Cart table */}
            <div className={styles.tableWrap}>
              <table className={styles.cartTable}>
                <thead>
                  <tr>
                    <th className={styles.thRemove}></th>
                    <th className={styles.thProduct}>Product</th>
                    <th className={styles.thPrice}>Price</th>
                    <th className={styles.thQty}>Quantity</th>
                    <th className={styles.thSubtotal}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id || `${item.productId}-${item.size || ""}`} className={styles.cartRow}>
                      <td className={styles.tdRemove}>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeItem(item)}
                          aria-label={`Remove ${item.name}`}
                        >
                          &times;
                        </button>
                      </td>
                      <td className={styles.tdProduct}>
                        <div className={styles.productCell}>
                          <div className={styles.productThumb}>
                            {item.image ? (
                              <img className={styles.productThumbBg} src={item.image} alt={item.name} />
                            ) : (
                              <div className={styles.productThumbBg} style={fallbackCardStyle(item.productId || item.id)} />
                            )}
                          </div>
                          <div className={styles.productDetails}>
                            <a href={`/product/${(item.slug || item.productId || item.id || "").toLowerCase()}`} className={`display ${styles.productName}`}>
                              {item.name}
                            </a>
                            <span className={styles.productMeta}>{item.collection}</span>
                            <span className={styles.productMeta}>{item.detail}</span>
                            {item.size ? <span className={styles.productSize}>Size: {item.size}</span> : null}
                          </div>
                        </div>
                      </td>
                      <td className={styles.tdPrice}>{formatPrice(Number(item.unitPrice || item.price || 0))}</td>
                      <td className={styles.tdQty}>
                        <div className={styles.qtyStepper}>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQty(item, -1)}
                            disabled={item.qty <= 1}
                            aria-label="Decrease"
                          >
                            &#8722;
                          </button>
                          <span className={styles.qtyVal}>{item.qty}</span>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQty(item, 1)}
                            aria-label="Increase"
                          >
                            &#43;
                          </button>
                        </div>
                      </td>
                      <td className={styles.tdSubtotal}>
                        {formatPrice(Number(item.unitPrice || item.price || 0) * Number(item.qty || 1))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Coupon + Totals */}
            <div className={styles.cartFooter}>
              {/* Coupon */}
              <div className={styles.couponSection}>
                <h3 className={styles.couponTitle}>Have a coupon?</h3>
                <p className={styles.couponHint}>Enter code <strong>HEER10</strong> for 10% off your first order.</p>
                <div className={styles.couponRow}>
                  <input
                    type="text"
                    className={styles.couponInput}
                    placeholder="Coupon code"
                    value={coupon}
                    onChange={(e) => { setCoupon(e.target.value); setCouponError(""); }}
                    aria-label="Coupon code"
                  />
                  <button className={`btn ${styles.couponBtn}`} onClick={applyCoupon}>
                    <span>Apply</span>
                  </button>
                </div>
                {couponApplied && (
                  <p className={styles.couponSuccess}>Coupon applied. 10% discount added.</p>
                )}
                {couponError && <p className={styles.couponError}>{couponError}</p>}
              </div>

              {/* Totals */}
              <div className={styles.totalsBox}>
                <h3 className={`display ${styles.totalsTitle}`}>Cart Totals</h3>
                <div className={styles.totalsRow}>
                  <span className={styles.totalsLabel}>Subtotal</span>
                  <span className={styles.totalsValue}>{formatPrice(subtotal)}</span>
                </div>
                {couponApplied && (
                  <div className={styles.totalsRow}>
                    <span className={styles.totalsLabel}>Discount (10%)</span>
                    <span className={`${styles.totalsValue} ${styles.totalsDiscount}`}>
                      -{formatPrice(discount)}
                    </span>
                  </div>
                )}
                <div className={styles.totalsRow}>
                  <span className={styles.totalsLabel}>Shipping</span>
                  <span className={styles.totalsValue} style={{ color: "rgba(26,21,18,0.5)" }}>
                    Calculated at checkout
                  </span>
                </div>
                <div className={`${styles.totalsRow} ${styles.totalsRowTotal}`}>
                  <span className={styles.totalsFinalLabel}>Total</span>
                  <span className={styles.totalsFinalValue}>{formatPrice(total)}</span>
                </div>
                <a href="/checkout" className={`btn ${styles.checkoutBtn}`}>
                  <span>Proceed to Checkout</span>
                  <span className="btn-arrow">&#8594;</span>
                </a>
                <a href="/shop" className={styles.continueLink}>
                  Continue Shopping
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
