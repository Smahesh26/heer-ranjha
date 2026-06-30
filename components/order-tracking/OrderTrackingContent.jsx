"use client";
import { useState } from "react";
import styles from "./orderTracking.module.css";

const DEMO_ORDER = {
  id: "HR-2025-0312",
  date: "14 April 2025",
  status: "Shipped",
  statusStep: 2,
  email: "priya@example.com",
  items: [
    { name: "Red Chanderi Lehenga", detail: "Asaya Collection · Size M", price: "₹35,000" },
    { name: "Ivory Organza Lehenga", detail: "Asaya Collection · Size S", price: "₹38,000" },
  ],
  total: "₹73,000",
  address: "Delhi, India",
  courier: "Blue Dart",
  trackingNo: "BD9284710345",
};

const STATUS_STEPS = [
  { label: "Order Placed", icon: "✓" },
  { label: "Processing", icon: "◈" },
  { label: "Shipped", icon: "▶" },
  { label: "Delivered", icon: "◉" },
];

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

  const handleTrack = () => {
    setError("");
    if (!orderId.trim() || !email.trim()) {
      setError("Please enter both your Order ID and billing email.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (
        orderId.trim().toUpperCase() === DEMO_ORDER.id ||
        orderId.trim() === "demo"
      ) {
        setResult(DEMO_ORDER);
      } else {
        setError(
          "No order found with that ID and email combination. Try Order ID: HR-2025-0312"
        );
        setResult(null);
      }
    }, 1200);
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
              Try Order ID <strong>HR-2025-0312</strong> with any email to see a demo result.
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
                <h2 className={`display ${styles.resultOrderId}`}>{result.id}</h2>
                <p className={styles.resultDate}>Placed on {result.date}</p>
              </div>
              <span className={styles.statusChip}>{result.status}</span>
            </div>

            {/* Progress bar */}
            <div className={styles.progressWrap} aria-label="Order status progress">
              {STATUS_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`${styles.progressStep} ${i <= result.statusStep ? styles.progressStepDone : ""}`}
                >
                  <div className={styles.progressDot}>
                    {i <= result.statusStep ? (
                      <span className={styles.progressDotIcon}>{step.icon}</span>
                    ) : null}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`${styles.progressLine} ${i < result.statusStep ? styles.progressLineDone : ""}`} />
                  )}
                  <span className={styles.progressLabel}>{step.label}</span>
                </div>
              ))}
            </div>

            {/* Order items */}
            <div className={styles.resultItems}>
              <h3 className={styles.resultSectionTitle}>Items in this Order</h3>
              {result.items.map((item, i) => (
                <div key={i} className={styles.resultItem}>
                  <div>
                    <p className={`display ${styles.resultItemName}`}>{item.name}</p>
                    <p className={styles.resultItemDetail}>{item.detail}</p>
                  </div>
                  <p className={styles.resultItemPrice}>{item.price}</p>
                </div>
              ))}
              <div className={styles.resultTotal}>
                <span className={styles.resultTotalLabel}>Order Total</span>
                <span className={`display ${styles.resultTotalValue}`}>{result.total}</span>
              </div>
            </div>

            {/* Shipping info */}
            <div className={styles.resultShipping}>
              <h3 className={styles.resultSectionTitle}>Shipping Details</h3>
              <div className={styles.resultShippingGrid}>
                <div className={styles.resultShippingItem}>
                  <span className={styles.resultShippingLabel}>Courier</span>
                  <span className={styles.resultShippingValue}>{result.courier}</span>
                </div>
                <div className={styles.resultShippingItem}>
                  <span className={styles.resultShippingLabel}>Tracking No.</span>
                  <span className={styles.resultShippingValue}>{result.trackingNo}</span>
                </div>
                <div className={styles.resultShippingItem}>
                  <span className={styles.resultShippingLabel}>Destination</span>
                  <span className={styles.resultShippingValue}>{result.address}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
