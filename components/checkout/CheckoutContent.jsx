"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/components/shop/shopData";
import styles from "./checkout.module.css";

function PageHeader() {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderInner}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <a href="/" className={styles.breadcrumbLink}>Home</a>
          <span className={styles.breadcrumbSep}>/</span>
          <a href="/cart" className={styles.breadcrumbLink}>Cart</a>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Checkout</span>
        </nav>
        <h1 className={`display ${styles.pageTitle}`}>Checkout</h1>
      </div>
    </div>
  );
}

export default function CheckoutContent() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [user, setUser] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState("");
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
  });

  useEffect(() => {
    let active = true;

    async function loadCheckout() {
      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" });
        const loggedIn = meRes.ok;
        if (!active) return;

        setIsLoggedIn(loggedIn);

        if (!loggedIn) {
          setIsRedirecting(true);
          router.replace("/my-account?from=checkout&next=/checkout");
          return;
        }

        const meData = await meRes.json().catch(() => ({}));
        if (active) {
          setUser(meData.user || null);
          setForm((prev) => ({
            ...prev,
            fullName: meData?.user?.name || "",
            email: meData?.user?.email || "",
          }));
        }

        const cartRes = await fetch("/api/cart", { cache: "no-store" });
        const cartData = await cartRes.json().catch(() => ({ items: [] }));
        if (active) {
          setItems(cartData.items || []);
        }

        const addressRes = await fetch("/api/account/addresses", { cache: "no-store" });
        const addressData = await addressRes.json().catch(() => ({ addresses: [] }));
        if (active && Array.isArray(addressData.addresses) && addressData.addresses.length) {
          const preferred = addressData.addresses.find((item) => item.isDefault) || addressData.addresses[0];
          setForm((prev) => ({
            ...prev,
            fullName: prev.fullName || preferred.fullName || "",
            phone: prev.phone || preferred.phone || "",
            city: prev.city || preferred.city || "",
            address: [preferred.line1, preferred.line2].filter(Boolean).join(", "),
          }));
        }
      } finally {
        if (active) setAuthReady(true);
      }
    }

    void loadCheckout();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) {
      setRazorpayReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    script.onerror = () => setRazorpayReady(false);
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 1), 0),
    [items]
  );
  const totalQty = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
    [items]
  );

  async function handlePlaceOrder() {
    setCheckoutError("");
    setCheckoutSuccess("");

    if (!form.fullName.trim() || !form.email.trim() || !form.city.trim() || !form.address.trim()) {
      setCheckoutError("Please fill full name, email, city and address before placing order.");
      return;
    }

    if (!items.length) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    setPlacing(true);
    try {
      const orderPayload = {
        userId: user?.id,
        orderNumber: `HR-${Date.now()}`,
        subtotal,
        discount: 0,
        shippingFee: 0,
        tax: 0,
        total: subtotal,
        paymentMode: "razorpay",
        paymentStatus: "unpaid",
        shippingName: form.fullName.trim(),
        shippingEmail: form.email.trim().toLowerCase(),
        shippingPhone: form.phone.trim() || null,
        shippingAddress: `${form.address.trim()}${form.city.trim() ? `, ${form.city.trim()}` : ""}`,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity || 1),
          price: Number(item.unitPrice || 0),
          title: item.name,
          image: item.image || null,
        })),
      };

      const createOrderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const createOrderData = await createOrderRes.json().catch(() => ({}));
      if (!createOrderRes.ok || !createOrderData?.order?.id) {
        throw new Error(createOrderData?.error || "Unable to create order");
      }

      const appOrder = createOrderData.order;
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const canUseRazorpay = Boolean(razorpayKey && razorpayReady && typeof window !== "undefined" && window.Razorpay);

      if (!canUseRazorpay) {
        await fetch("/api/cart", { method: "DELETE" }).catch(() => {});
        setItems([]);
        setCheckoutSuccess(`Order ${appOrder.orderNumber || appOrder.id} placed. Payment is pending.`);
        return;
      }

      const paymentOrderRes = await fetch("/api/payments/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(subtotal || 0),
          currency: "INR",
          receipt: appOrder.orderNumber || appOrder.id,
          orderId: appOrder.id,
        }),
      });
      const paymentOrderData = await paymentOrderRes.json().catch(() => ({}));
      if (!paymentOrderRes.ok || !paymentOrderData?.order?.id) {
        throw new Error(paymentOrderData?.error || "Unable to initiate payment");
      }

      const rzOrder = paymentOrderData.order;
      const razorpay = new window.Razorpay({
        key: razorpayKey,
        amount: rzOrder.amount,
        currency: rzOrder.currency,
        name: "Heer Ranjha",
        description: `Order ${appOrder.orderNumber || appOrder.id}`,
        order_id: rzOrder.id,
        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#1A1512" },
        handler: async (response) => {
          const verifyRes = await fetch("/api/payments/razorpay-order", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: appOrder.id,
              amount: subtotal,
              currency: "INR",
              paymentMethod: "razorpay",
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json().catch(() => ({}));
          if (!verifyRes.ok || !verifyData?.verified) {
            setCheckoutError(verifyData?.error || "Payment verification failed");
            return;
          }

          await fetch("/api/cart", { method: "DELETE" }).catch(() => {});
          setItems([]);
          setCheckoutSuccess(`Payment successful. Order ${appOrder.orderNumber || appOrder.id} confirmed.`);
          router.replace("/my-account?section=orders&from=checkout");
        },
      });

      razorpay.on("payment.failed", (event) => {
        const message = event?.error?.description || "Payment failed. Please try again.";
        setCheckoutError(message);
      });

      razorpay.open();
    } catch (error) {
      setCheckoutError(error.message || "Unable to place order");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <>
      <PageHeader />

      <div className={styles.checkoutLayout}>
        {!authReady || isRedirecting ? (
          <div className={styles.loadingState}>
            <h2 className={`display ${styles.loadingTitle}`}>
              {isRedirecting ? "Redirecting to login..." : "Loading checkout..."}
            </h2>
          </div>
        ) : null}

        {authReady && isLoggedIn && items.length === 0 ? (
          <section className={styles.emptyState}>
            <h2 className={`display ${styles.emptyTitle}`}>Your cart is empty</h2>
            <p className={styles.emptySub}>Add pieces to your cart before checkout.</p>
            <a href="/shop" className="btn">
              <span>Go to Shop</span>
              <span className="btn-arrow">→</span>
            </a>
          </section>
        ) : null}

        {authReady && isLoggedIn && items.length > 0 ? (
          <section className={styles.checkoutGrid}>
            <div className={styles.formPanel}>
              <p className="eyebrow">Shipping Details</p>
              <h2 className={`display ${styles.sectionTitle}`}>Delivery Information</h2>

              <div className={styles.formGrid}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Full Name</span>
                  <input
                    className={styles.fieldInput}
                    placeholder="Your full name"
                    value={form.fullName}
                    onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Email</span>
                  <input
                    className={styles.fieldInput}
                    placeholder="you@example.com"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Phone</span>
                  <input
                    className={styles.fieldInput}
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>City</span>
                  <input
                    className={styles.fieldInput}
                    placeholder="City"
                    value={form.city}
                    onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                  />
                </label>
                <label className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                  <span className={styles.fieldLabel}>Address</span>
                  <textarea
                    className={styles.fieldTextarea}
                    placeholder="House number, street, landmark"
                    rows={4}
                    value={form.address}
                    onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                  />
                </label>
              </div>

              {checkoutError ? <p className={styles.formError}>{checkoutError}</p> : null}
              {checkoutSuccess ? <p className={styles.formSuccess}>{checkoutSuccess}</p> : null}
            </div>

            <aside className={styles.summaryPanel}>
              <p className="eyebrow">Order Summary</p>
              <h2 className={`display ${styles.sectionTitle}`}>Your Order</h2>
              <p className={styles.summaryMeta}>{items.length} item{items.length !== 1 ? "s" : ""} · {totalQty} piece{totalQty !== 1 ? "s" : ""}</p>

              <div className={styles.summaryList}>
                {items.map((item) => (
                  <div key={item.id} className={styles.summaryRow}>
                    <div>
                      <p className={styles.summaryName}>{item.name}</p>
                      <p className={styles.summarySub}>Qty {item.quantity}{item.size ? ` · Size ${item.size}` : ""}</p>
                    </div>
                    <span className={styles.summaryValue}>{formatPrice(Number(item.unitPrice || 0) * Number(item.quantity || 1))}</span>
                  </div>
                ))}
              </div>

              <div className={styles.totalRow}>
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <button className={`btn ${styles.placeOrderBtn}`} type="button" onClick={handlePlaceOrder} disabled={placing}>
                <span>{placing ? "Processing..." : "Place Order"}</span>
                <span className="btn-arrow">→</span>
              </button>

              <div className={styles.returnPolicy}>
                <p className="eyebrow">3 DAYS effortless return</p>
                <p className={styles.returnPolicyIntro}>
                  If your garment is damaged, defective, or incorrect, you can raise a return request within 3 DAYS after delivery.
                </p>

                <h3 className={styles.returnPolicyTitle}>Know how to effortlessly return</h3>
                <ol className={styles.returnPolicyList}>
                  <li>Email us at returns.newinsub@gmail.com within 3 days of receiving your order.</li>
                  <li>Our support team will arrange a reverse pickup and share next steps.</li>
                  <li>Pack the product in its original packaging and hand it over to the pickup agent.</li>
                </ol>

                <p className={styles.returnPolicyFinePrint}>
                  Products must be unused, in original condition, with all tags intact. Sale and customized items are not eligible for return. INR 200 reverse pickup fee and COD charges (if applicable) will be deducted. Approved returns are issued as store credit only.
                </p>
              </div>
            </aside>
          </section>
        ) : null}
      </div>
    </>
  );
}
