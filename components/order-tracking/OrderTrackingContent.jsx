"use client";
import { useState } from "react";
import styles from "./orderTracking.module.css";

const STATUS_STEPS = [
  { label: "Order Placed", icon: "✓" },
  { label: "Processing", icon: "◈" },
  { label: "Shipped", icon: "▶" },
  { label: "Delivered", icon: "◉" },
];

function getStatusStep(status) {
  const normalized = String(status || "PENDING").toUpperCase();
  if (normalized === "DELIVERED") return 3;
  if (normalized === "SHIPPED") return 2;
  if (normalized === "PROCESSING" || normalized === "CONFIRMED" || normalized === "PACKED") return 1;
  return 0;
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function PageHeader() {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderInner}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <a href="/" className={styles.breadcrumbLink}>Home</a>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Order Tracking</span>
        </nav>
        <h1 className={`display ${styles.pageTitle}`}>Track Your Order</h1>
        <p className={styles.pageSub}>
          Enter your Order ID and the billing email used at checkout to see your order status.
        </p>
      </div>
    </div>
  );
}

export default function OrderTrackingContent() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    setError("");
    if (!orderId.trim() || !email.trim()) {
      setError("Please enter both your Order ID and billing email.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim(), email: email.trim().toLowerCase() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.order) {
        throw new Error(data?.error || "No order found with that ID and email.");
      }

      setResult(data.order);
    } catch (trackError) {
      setResult(null);
      setError(trackError.message || "Unable to fetch order details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader />

      <div className={styles.trackingLayout}>
        {/* Form section */}
        <div className={styles.formSection}>
          <div className={styles.formCard}>
            <div className={styles.formIcon} aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="1" y="3" width="15" height="13" rx="1" strokeLinecap="round"/>
                <path d="M16 8h4l3 3v5h-7V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <h2 className={`display ${styles.formTitle}`}>Track Order</h2>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="order-id">Order ID</label>
              <input
                id="order-id"
                type="text"
                className={styles.fieldInput}
                placeholder="e.g. HR-2025-0312"
                value={orderId}
                onChange={(e) => { setOrderId(e.target.value); setError(""); }}
                aria-label="Order ID"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="billing-email">Billing Email</label>
              <input
                id="billing-email"
                type="email"
                className={styles.fieldInput}
                placeholder="email used at checkout"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                aria-label="Billing email"
              />
            </div>

            {error && <p className={styles.formError} role="alert">{error}</p>}

            <button
              className={`btn ${styles.trackBtn}`}
              onClick={handleTrack}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <span>Searching...</span>
              ) : (
                <>
                  <span>Track Order</span>
                  <span className="btn-arrow">&#8594;</span>
                </>
              )}
            </button>

            <p className={styles.formHint}>
              Use your order number from confirmation email, for example <strong>HR-1720458261000</strong>.
            </p>
          </div>

          {/* Info card */}
          <div className={styles.infoCard}>
            <h3 className={`display ${styles.infoTitle}`}>Need Help?</h3>
            <p className={styles.infoText}>
              If you cannot locate your Order ID, check the confirmation email sent to you at the time of purchase. For further assistance, reach our boutiques directly.
            </p>
            <div className={styles.infoLocations}>
              <div className={styles.infoLocation}>
                <p className="eyebrow">Delhi Boutique</p>
                <p className={styles.infoLocationAddr}>New Delhi, India</p>
              </div>
              <div className={styles.infoLocation}>
                <p className="eyebrow">Bareilly Boutique</p>
                <p className={styles.infoLocationAddr}>Bareilly, Uttar Pradesh</p>
              </div>
            </div>
            <a href="mailto:orders@heerranjha.com" className={styles.infoEmail}>
              orders@heerranjha.com
            </a>
          </div>
        </div>

        {/* Result panel */}
        {result && (
          <div className={styles.resultSection} aria-live="polite">
            <div className={styles.resultHeader}>
              <div>
                <p className="eyebrow">Order Found</p>
                <h2 className={`display ${styles.resultOrderId}`}>{result.orderNumber || result.id}</h2>
                <p className={styles.resultDate}>Placed on {formatDate(result.createdAt)}</p>
              </div>
              <span className={styles.statusChip}>{String(result.status || "PENDING").replaceAll("_", " ")}</span>
            </div>

            {/* Progress bar */}
            <div className={styles.progressWrap} aria-label="Order status progress">
              {STATUS_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`${styles.progressStep} ${i <= getStatusStep(result.status) ? styles.progressStepDone : ""}`}
                >
                  <div className={styles.progressDot}>
                    {i <= getStatusStep(result.status) ? (
                      <span className={styles.progressDotIcon}>{step.icon}</span>
                    ) : null}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`${styles.progressLine} ${i < getStatusStep(result.status) ? styles.progressLineDone : ""}`} />
                  )}
                  <span className={styles.progressLabel}>{step.label}</span>
                </div>
              ))}
            </div>

            {/* Order items */}
            <div className={styles.resultItems}>
              <h3 className={styles.resultSectionTitle}>Items in this Order</h3>
              {(result.items || []).map((item, i) => (
                <div key={`${item.id || item.productId || i}`} className={styles.resultItem}>
                  <div>
                    <p className={`display ${styles.resultItemName}`}>{item.title || item.name || "Product"}</p>
                    <p className={styles.resultItemDetail}>Qty {item.quantity || 1}</p>
                  </div>
                  <p className={styles.resultItemPrice}>{formatPrice(item.price)}</p>
                </div>
              ))}
              <div className={styles.resultTotal}>
                <span className={styles.resultTotalLabel}>Order Total</span>
                <span className={`display ${styles.resultTotalValue}`}>{formatPrice(result.total)}</span>
              </div>
            </div>

            {/* Shipping info */}
            <div className={styles.resultShipping}>
              <h3 className={styles.resultSectionTitle}>Shipping Details</h3>
              <div className={styles.resultShippingGrid}>
                <div className={styles.resultShippingItem}>
                  <span className={styles.resultShippingLabel}>Courier</span>
                  <span className={styles.resultShippingValue}>{result.courierName || "Pending"}</span>
                </div>
                <div className={styles.resultShippingItem}>
                  <span className={styles.resultShippingLabel}>Tracking No.</span>
                  <span className={styles.resultShippingValue}>{result.trackingNumber || "Not assigned"}</span>
                </div>
                <div className={styles.resultShippingItem}>
                  <span className={styles.resultShippingLabel}>Destination</span>
                  <span className={styles.resultShippingValue}>{result.shippingAddress || "-"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
