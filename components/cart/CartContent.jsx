"use client";
import { useState } from "react";
import { formatPrice } from "@/components/shop/shopData";
import styles from "./cart.module.css";

const INITIAL_ITEMS = [
  {
    id: "HKM-304",
    name: "Pink Matka Kurta Set",
    detail: "Cotton Pant · Hand Embroidery",
    collection: "Nayi Leher",
    size: "L",
    price: 8500,
    qty: 1,
    colorA: "#D4A090",
    colorB: "#8A5040",
  },
  {
    id: "HSD-348",
    name: "Mint Green Sherwani Set",
    detail: "Dupion Fabric · Hand Embroidery",
    collection: "Nayi Leher",
    size: "M",
    price: 22000,
    qty: 1,
    colorA: "#80C0A8",
    colorB: "#308060",
  },
];

function PageHeader() {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderInner}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <a href="/" className={styles.breadcrumbLink}>Home</a>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Cart</span>
        </nav>
        <h1 className={`display ${styles.pageTitle}`}>Your Cart</h1>
      </div>
    </div>
  );
}

export default function CartContent() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  const updateQty = (id, delta) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

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
      <PageHeader />

      <div className={styles.cartLayout}>
        {items.length === 0 ? (
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
        ) : (
          <div className={styles.cartMain}>
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
                    <tr key={item.id} className={styles.cartRow}>
                      <td className={styles.tdRemove}>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                        >
                          &times;
                        </button>
                      </td>
                      <td className={styles.tdProduct}>
                        <div className={styles.productCell}>
                          <div className={styles.productThumb}>
                            <div
                              className={styles.productThumbBg}
                              style={{
                                background: `radial-gradient(ellipse 75% 75% at 55% 40%, ${item.colorA}, ${item.colorB})`,
                              }}
                            />
                          </div>
                          <div className={styles.productDetails}>
                            <a href={`/product/${item.id.toLowerCase()}`} className={`display ${styles.productName}`}>
                              {item.name}
                            </a>
                            <span className={styles.productMeta}>{item.collection}</span>
                            <span className={styles.productMeta}>{item.detail}</span>
                            <span className={styles.productSize}>Size: {item.size}</span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.tdPrice}>{formatPrice(item.price)}</td>
                      <td className={styles.tdQty}>
                        <div className={styles.qtyStepper}>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQty(item.id, -1)}
                            disabled={item.qty <= 1}
                            aria-label="Decrease"
                          >
                            &#8722;
                          </button>
                          <span className={styles.qtyVal}>{item.qty}</span>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQty(item.id, 1)}
                            aria-label="Increase"
                          >
                            &#43;
                          </button>
                        </div>
                      </td>
                      <td className={styles.tdSubtotal}>
                        {formatPrice(item.price * item.qty)}
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
        )}
      </div>
    </>
  );
}
