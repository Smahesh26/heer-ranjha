"use client";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/components/shop/shopData";
import { syncGuestDataToUser } from "@/lib/client-cart-wishlist";
import styles from "./myAccount.module.css";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "◈" },
  { key: "orders", label: "My Orders", icon: "▦" },
  { key: "payments", label: "Payments", icon: "◍" },
  { key: "addresses", label: "Addresses", icon: "◎" },
  { key: "details", label: "Account Details", icon: "✦" },
];

function formatOrderDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getOrderItemCount(order) {
  if (!Array.isArray(order?.items)) return 0;
  return order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function getPaymentRows(orders) {
  if (!Array.isArray(orders)) return [];

  const rows = orders.flatMap((order) => {
    const txns = Array.isArray(order?.paymentTransactions) ? order.paymentTransactions : [];
    if (!txns.length) {
      return [
        {
          key: `fallback-${order.id}`,
          orderNumber: order.orderNumber || order.id,
          createdAt: order.createdAt,
          paymentMode: order.paymentMode || "-",
          paymentStatus: order.paymentStatus || "unpaid",
          paymentId: order.razorpayPaymentId || order.paymentId || "-",
          amount: Number(order.total || 0),
        },
      ];
    }

    return txns.map((txn) => ({
      key: txn.id,
      orderNumber: order.orderNumber || order.id,
      createdAt: txn.createdAt || order.createdAt,
      paymentMode: txn.paymentMethod || order.paymentMode || "-",
      paymentStatus: txn.status || order.paymentStatus || "unpaid",
      paymentId: txn.providerPaymentId || order.razorpayPaymentId || order.paymentId || "-",
      amount: Number(txn.amount || order.total || 0),
    }));
  });

  return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function PageHeader() {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderInner}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <a href="/" className={styles.breadcrumbLink}>Home</a>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>My Account</span>
        </nav>
        <h1 className={`display ${styles.pageTitle}`}>My Account</h1>
      </div>
    </div>
  );
}

function LoggedOutView({ onLogin, onRegister, loading, authError, autoFocusLogin }) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [otpMode, setOtpMode] = useState(false);
  const [otpNotice, setOtpNotice] = useState("");
  const [remember, setRemember] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const loginEmailRef = useRef(null);

  useEffect(() => {
    if (!autoFocusLogin) return;
    loginEmailRef.current?.focus();
  }, [autoFocusLogin]);

  const handleLogin = async () => {
    if (!loginEmail || !loginPass) {
      setLoginError("Please enter your email and password.");
      return;
    }
    if (otpMode && !loginOtp) {
      setLoginError("Please enter the OTP sent to your email.");
      return;
    }

    setLoginError("");
    setOtpNotice("");
    const result = await onLogin(loginEmail, loginPass, otpMode ? loginOtp : undefined);

    if (result?.otpRequired) {
      setOtpMode(true);
      setOtpNotice(result.message || "OTP sent to your email.");
      setLoginOtp("");
      return;
    }

    if (result?.error) {
      setLoginError(result.error);
    }
  };

  const handleResendOtp = async () => {
    if (!loginEmail || !loginPass) {
      setLoginError("Please enter your email and password first.");
      return;
    }

    setLoginError("");
    const result = await onLogin(loginEmail, loginPass);
    if (result?.otpRequired) {
      setOtpNotice(result.message || "OTP resent to your email.");
    } else if (result?.error) {
      setLoginError(result.error);
    }
  };

  const handleRegister = async () => {
    if (!regName || !regEmail || !regPass) {
      setLoginError("Please fill all register fields.");
      return;
    }
    setLoginError("");
    await onRegister(regName, regEmail, regPass);
  };

  return (
    <div className={styles.authLayout}>
      {/* Login */}
      <div className={styles.authCard}>
        <h2 className={`display ${styles.authTitle}`}>Login</h2>
        <p className={styles.authSub}>Welcome back. Sign in to your Heer Ranjha account.</p>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="login-email">Email Address</label>
          <input ref={loginEmailRef} id="login-email" type="email" className={styles.fieldInput} placeholder="your@email.com" value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setLoginError(""); setOtpMode(false); setLoginOtp(""); setOtpNotice(""); }} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="login-pass">Password</label>
          <input id="login-pass" type="password" className={styles.fieldInput} placeholder="Password" value={loginPass} onChange={(e) => { setLoginPass(e.target.value); setLoginError(""); setOtpMode(false); setLoginOtp(""); setOtpNotice(""); }} />
        </div>

        {otpMode ? (
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="login-otp">Email OTP</label>
            <input
              id="login-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              className={styles.fieldInput}
              placeholder="Enter 6-digit OTP"
              value={loginOtp}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                setLoginOtp(value);
                setLoginError("");
              }}
            />
          </div>
        ) : null}

        {otpNotice ? <p className={styles.sectionSub}>{otpNotice}</p> : null}

        {loginError && <p className={styles.fieldError} role="alert">{loginError}</p>}

        <div className={styles.rememberRow}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" className={styles.checkboxInput} checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span className={styles.checkboxMark} aria-hidden="true" />
            <span className={styles.checkboxText}>Remember me</span>
          </label>
          <a href="#" className={styles.forgotLink}>Lost your password?</a>
        </div>

        <button className={`btn ${styles.authBtn}`} onClick={handleLogin} disabled={loading}>
          <span>{loading ? (otpMode ? "Verifying..." : "Sending OTP...") : (otpMode ? "Verify OTP" : "Sign In")}</span>
          <span className="btn-arrow">&#8594;</span>
        </button>

        {otpMode ? (
          <button className={styles.orderViewLink} type="button" onClick={handleResendOtp} disabled={loading}>
            Resend OTP
          </button>
        ) : null}

        {loginError ? <p className={styles.fieldError}>{loginError}</p> : null}
        {authError ? <p className={styles.fieldError}>{authError}</p> : null}
      </div>

      {/* Register */}
      <div className={styles.authCard}>
        <h2 className={`display ${styles.authTitle}`}>Register</h2>
        <p className={styles.authSub}>Create an account to track orders, save your wishlist, and store your delivery addresses.</p>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="reg-name">Full Name</label>
          <input id="reg-name" type="text" className={styles.fieldInput} placeholder="Your name" value={regName} onChange={(e) => setRegName(e.target.value)} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="reg-email">Email Address</label>
          <input id="reg-email" type="email" className={styles.fieldInput} placeholder="your@email.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="reg-pass">Password</label>
          <input id="reg-pass" type="password" className={styles.fieldInput} placeholder="Choose a password" value={regPass} onChange={(e) => setRegPass(e.target.value)} />
        </div>

        <p className={styles.privacyNote}>
          Your personal data will be used to support your experience throughout this website, to manage access to your account, and for other purposes described in our privacy policy.
        </p>

        <button className={`btn ${styles.authBtn}`} onClick={handleRegister} disabled={loading}>
          <span>{loading ? "Creating..." : "Create Account"}</span>
          <span className="btn-arrow">&#8594;</span>
        </button>
      </div>
    </div>
  );
}

function Dashboard({ user, cartItems, orders, continueCheckoutHref }) {
  const paymentRows = getPaymentRows(orders);

  return (
    <>
      <p className={styles.dashGreeting}>
        Hello, <strong>{user.name.split(" ")[0]}</strong>. From your account dashboard you can view your recent orders, manage your shipping and billing addresses, and edit your password and account details.
      </p>

      {continueCheckoutHref ? (
        <div className={styles.dashActions}>
          <a href={continueCheckoutHref} className="btn">
            <span>Continue to Checkout</span>
            <span className="btn-arrow">&#8594;</span>
          </a>
        </div>
      ) : null}

      <div className={styles.dashCards}>
        {[
          { label: "Orders", icon: "▦", desc: "View and track your orders", href: "#orders" },
          { label: "Addresses", icon: "◎", desc: "Manage billing and shipping", href: "#addresses" },
          { label: "Account Details", icon: "✦", desc: "Update name, email and password", href: "#details" },
        ].map((card) => (
          <a key={card.label} href={card.href} className={styles.dashCard}>
            <span className={styles.dashCardIcon} aria-hidden="true">{card.icon}</span>
            <span className={`display ${styles.dashCardLabel}`}>{card.label}</span>
            <span className={styles.dashCardDesc}>{card.desc}</span>
          </a>
        ))}
      </div>

      <div className={styles.recentOrders}>
        <h3 className={styles.recentTitle}>Current Cart Items</h3>
        {cartItems.length ? (
          <div className={styles.ordersTableWrap}>
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id} className={styles.orderRow}>
                    <td className={styles.orderId}>{item.name}</td>
                    <td className={styles.orderDate}>{item.size || "-"}</td>
                    <td className={styles.orderItems}>{item.quantity}</td>
                    <td className={styles.orderTotal}>{formatPrice(item.unitPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.sectionSub}>No items in your cart yet.</p>
        )}
      </div>

      <div className={styles.recentOrders}>
        <h3 className={styles.recentTitle}>Recent Orders</h3>
        <div className={styles.ordersTableWrap}>
          <table className={styles.ordersTable}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Status</th>
                <th>Items</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((order) => (
                  <tr key={order.id} className={styles.orderRow}>
                    <td className={styles.orderId}>{order.orderNumber || order.id}</td>
                    <td className={styles.orderDate}>{formatOrderDate(order.createdAt)}</td>
                    <td>
                      <span className={`${styles.orderStatus} ${String(order.status || "").toUpperCase() === "DELIVERED" ? styles.statusDelivered : styles.statusShipped}`}>
                        {String(order.status || "Pending").replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className={styles.orderItems}>{getOrderItemCount(order)} piece{getOrderItemCount(order) !== 1 ? "s" : ""}</td>
                    <td className={styles.orderTotal}>{formatPrice(Number(order.total || 0))}</td>
                    <td>
                      <a href="/order-tracking" className={styles.orderViewLink}>Track</a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className={styles.orderRow}>
                  <td className={styles.orderDate} colSpan={6}>No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.recentOrders}>
        <h3 className={styles.recentTitle}>Payment History</h3>
        <div className={styles.ordersTableWrap}>
          <table className={styles.ordersTable}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Mode</th>
                <th>Payment</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {paymentRows.length ? (
                paymentRows.map((payment) => (
                  <tr key={`pay-${payment.key}`} className={styles.orderRow}>
                    <td className={styles.orderId}>{payment.orderNumber}</td>
                    <td className={styles.orderDate}>{formatOrderDate(payment.createdAt)}</td>
                    <td className={styles.orderItems}>{payment.paymentMode}</td>
                    <td className={styles.orderDate}>{String(payment.paymentStatus || "unpaid").replaceAll("_", " ")}</td>
                    <td className={styles.orderTotal}>{formatPrice(Number(payment.amount || 0))}</td>
                  </tr>
                ))
              ) : (
                <tr className={styles.orderRow}>
                  <td className={styles.orderDate} colSpan={5}>No payments yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function OrdersView({ orders }) {
  return (
    <div>
      <h2 className={`display ${styles.sectionTitle}`}>My Orders</h2>
      <p className={styles.sectionSub}>All orders placed under your account.</p>
      <div className={styles.ordersTableWrap} style={{ marginTop: "1.5rem" }}>
        <table className={styles.ordersTable}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Status</th>
              <th>Items</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.length ? (
              orders.map((order) => (
                <tr key={order.id} className={styles.orderRow}>
                  <td className={styles.orderId}>{order.orderNumber || order.id}</td>
                  <td className={styles.orderDate}>{formatOrderDate(order.createdAt)}</td>
                  <td>
                    <span className={`${styles.orderStatus} ${String(order.status || "").toUpperCase() === "DELIVERED" ? styles.statusDelivered : styles.statusShipped}`}>
                      {String(order.status || "Pending").replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className={styles.orderItems}>{getOrderItemCount(order)} piece{getOrderItemCount(order) !== 1 ? "s" : ""}</td>
                  <td className={styles.orderTotal}>{formatPrice(Number(order.total || 0))}</td>
                  <td><a href="/order-tracking" className={styles.orderViewLink}>Track</a></td>
                </tr>
              ))
            ) : (
              <tr className={styles.orderRow}>
                <td className={styles.orderDate} colSpan={6}>No orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsView({ orders }) {
  const paymentRows = getPaymentRows(orders);

  return (
    <div>
      <h2 className={`display ${styles.sectionTitle}`}>Payment History</h2>
      <p className={styles.sectionSub}>All payment transactions linked with your orders.</p>
      <div className={styles.ordersTableWrap} style={{ marginTop: "1.5rem" }}>
        <table className={styles.ordersTable}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Payment ID</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {paymentRows.length ? (
              paymentRows.map((payment) => (
                <tr key={`txn-${payment.key}`} className={styles.orderRow}>
                  <td className={styles.orderId}>{payment.orderNumber}</td>
                  <td className={styles.orderDate}>{formatOrderDate(payment.createdAt)}</td>
                  <td className={styles.orderItems}>{payment.paymentMode}</td>
                  <td className={styles.orderDate}>{String(payment.paymentStatus || "unpaid").replaceAll("_", " ")}</td>
                  <td className={styles.orderDate}>{payment.paymentId || "-"}</td>
                  <td className={styles.orderTotal}>{formatPrice(Number(payment.amount || 0))}</td>
                </tr>
              ))
            ) : (
              <tr className={styles.orderRow}>
                <td className={styles.orderDate} colSpan={6}>No payments yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddressesView({ addresses, addressStatus, onAddressSubmit, onAddressDelete }) {
  const [form, setForm] = useState({
    id: "",
    label: "Shipping",
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: false,
  });

  function startEdit(address) {
    setForm({
      id: address.id,
      label: address.label || "Shipping",
      fullName: address.fullName || "",
      phone: address.phone || "",
      line1: address.line1 || "",
      line2: address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "India",
      isDefault: Boolean(address.isDefault),
    });
  }

  function resetForm() {
    setForm({
      id: "",
      label: "Shipping",
      fullName: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      isDefault: false,
    });
  }

  async function submitAddress() {
    await onAddressSubmit(form);
    resetForm();
  }

  return (
    <div>
      <h2 className={`display ${styles.sectionTitle}`}>Addresses</h2>
      <p className={styles.sectionSub}>Saved billing and shipping addresses for faster checkout.</p>

      <div className={styles.detailsForm}>
        <div className={styles.detailsRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Label</label>
            <input type="text" className={styles.fieldInput} value={form.label} onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Full Name</label>
            <input type="text" className={styles.fieldInput} value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} />
          </div>
        </div>
        <div className={styles.detailsRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Phone</label>
            <input type="text" className={styles.fieldInput} value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>City</label>
            <input type="text" className={styles.fieldInput} value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
          </div>
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Address Line 1</label>
          <input type="text" className={styles.fieldInput} value={form.line1} onChange={(e) => setForm((prev) => ({ ...prev, line1: e.target.value }))} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Address Line 2</label>
          <input type="text" className={styles.fieldInput} value={form.line2} onChange={(e) => setForm((prev) => ({ ...prev, line2: e.target.value }))} />
        </div>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" className={styles.checkboxInput} checked={form.isDefault} onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))} />
          <span className={styles.checkboxMark} aria-hidden="true" />
          <span className={styles.checkboxText}>Set as default address</span>
        </label>
        <button className="btn" onClick={submitAddress} type="button">
          <span>{form.id ? "Update Address" : "Add Address"}</span>
          <span className="btn-arrow">&#8594;</span>
        </button>
      </div>

      {addressStatus ? <p className={styles.sectionSub} style={{ marginTop: "0.8rem" }}>{addressStatus}</p> : null}

      <div className={styles.addressGrid}>
        {addresses.length ? addresses.map((address) => (
          <div key={address.id} className={styles.addressCard}>
            <h3 className={styles.addressType}>{address.label || "Address"}</h3>
            <p className={styles.addressEmpty}>{address.fullName}</p>
            <p className={styles.addressEmpty}>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
            <p className={styles.addressEmpty}>{address.city}{address.postalCode ? ` - ${address.postalCode}` : ""}</p>
            <div className={styles.detailsRow}>
              <button className={`btn ${styles.addressBtn}`} type="button" onClick={() => startEdit(address)}>
                <span>Edit</span>
              </button>
              <button className={styles.orderViewLink} type="button" onClick={() => onAddressDelete(address.id)}>
                Delete
              </button>
            </div>
          </div>
        )) : (
          <div className={styles.addressCard}>
            <h3 className={styles.addressType}>No saved addresses</h3>
            <p className={styles.addressEmpty}>Add a shipping address using the form above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountDetailsView({ user, profileStatus, onSaveProfile }) {
  const [firstName, setFirstName] = useState(user.name.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user.name.split(" ")[1] || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function saveChanges() {
    if (newPassword && newPassword !== confirmPassword) {
      onSaveProfile(null, "New password and confirm password do not match.");
      return;
    }

    const name = `${firstName} ${lastName}`.trim();
    await onSaveProfile({
      name,
      email,
      phone,
      ...(newPassword
        ? {
            currentPassword,
            newPassword,
          }
        : {}),
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div>
      <h2 className={`display ${styles.sectionTitle}`}>Account Details</h2>
      <p className={styles.sectionSub}>Update your name, email address and password.</p>
      <div className={styles.detailsForm}>
        <div className={styles.detailsRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>First Name</label>
            <input type="text" className={styles.fieldInput} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Last Name</label>
            <input type="text" className={styles.fieldInput} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Email Address</label>
          <input type="email" className={styles.fieldInput} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Phone</label>
          <input type="text" className={styles.fieldInput} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className={styles.detailsDivider} />
        <h3 className={styles.detailsSubhead}>Change Password</h3>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Current Password</label>
          <input type="password" className={styles.fieldInput} placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>New Password</label>
          <input type="password" className={styles.fieldInput} placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Confirm New Password</label>
          <input type="password" className={styles.fieldInput} placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <button className="btn" style={{ marginTop: "0.5rem" }} onClick={saveChanges} type="button">
          <span>Save Changes</span>
          <span className="btn-arrow">&#8594;</span>
        </button>
        {profileStatus ? <p className={styles.sectionSub}>{profileStatus}</p> : null}
      </div>
    </div>
  );
}

function LoggedInView({
  user,
  onLogout,
  cartItems,
  orders,
  addresses,
  addressStatus,
  profileStatus,
  onAddressSubmit,
  onAddressDelete,
  onSaveProfile,
  continueCheckoutHref,
}) {
  const [activeNav, setActiveNav] = useState("dashboard");

  const renderContent = () => {
    switch (activeNav) {
      case "orders": return <OrdersView orders={orders} />;
      case "payments": return <PaymentsView orders={orders} />;
      case "addresses": return <AddressesView addresses={addresses} addressStatus={addressStatus} onAddressSubmit={onAddressSubmit} onAddressDelete={onAddressDelete} />;
      case "details": return <AccountDetailsView user={user} profileStatus={profileStatus} onSaveProfile={onSaveProfile} />;
      default: return <Dashboard user={user} cartItems={cartItems} orders={orders} continueCheckoutHref={continueCheckoutHref} />;
    }
  };

  return (
    <div className={styles.accountLayout}>
      {/* Sidebar */}
      <aside className={styles.accountSidebar}>
        <div className={styles.sidebarUser}>
          <div className={styles.sidebarAvatar} aria-hidden="true">
            {user.name[0]}
          </div>
          <div>
            <p className={`display ${styles.sidebarName}`}>{user.name}</p>
            <p className={styles.sidebarEmail}>{user.email}</p>
          </div>
        </div>
        <nav className={styles.sidebarNav} aria-label="Account navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`${styles.sidebarNavItem} ${activeNav === item.key ? styles.sidebarNavItemActive : ""}`}
              onClick={() => setActiveNav(item.key)}
              aria-current={activeNav === item.key ? "page" : undefined}
            >
              <span className={styles.sidebarNavIcon} aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button className={`${styles.sidebarNavItem} ${styles.sidebarNavLogout}`} onClick={onLogout}>
            <span className={styles.sidebarNavIcon} aria-hidden="true">&#x2192;</span>
            Logout
          </button>
        </nav>
      </aside>

      {/* Content */}
      <div className={styles.accountContent}>
        {renderContent()}
      </div>
    </div>
  );
}

export default function MyAccountContent() {
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [addressStatus, setAddressStatus] = useState("");
  const [profileStatus, setProfileStatus] = useState("");
  const [continueCheckoutHref, setContinueCheckoutHref] = useState("");
  const [cameFromCheckout, setCameFromCheckout] = useState(false);

  async function loadAccountData() {
    const [cartRes, ordersRes, addressesRes] = await Promise.all([
      fetch("/api/cart", { cache: "no-store" }),
      fetch("/api/orders?scope=me", { cache: "no-store" }),
      fetch("/api/account/addresses", { cache: "no-store" }),
    ]);
    const cartData = await cartRes.json().catch(() => ({ items: [] }));
    const ordersData = await ordersRes.json().catch(() => ({ orders: [] }));
    const addressesData = await addressesRes.json().catch(() => ({ addresses: [] }));

    setCartItems(cartData.items || []);
    setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
    setAddresses(Array.isArray(addressesData.addresses) ? addressesData.addresses : []);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = new URLSearchParams(window.location.search);
    const nextParam = query.get("next") || "";
    setCameFromCheckout(query.get("from") === "checkout");
    setContinueCheckoutHref(nextParam.startsWith("/") ? nextParam : "");
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" });
        if (!meRes.ok) return;

        const meData = await meRes.json();
        if (!active) return;
        setUser(meData.user);

        await loadAccountData();
      } catch {
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(email, password, otp) {
    setLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, ...(otp ? { otp } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Login failed");
      }

      if (data?.otpRequired) {
        return { otpRequired: true, message: data?.message || "OTP sent to your email." };
      }

      await syncGuestDataToUser();
      setUser(data.user);
      await loadAccountData();
      return { ok: true };
    } catch (error) {
      setAuthError(error.message);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(name, email, password) {
    setLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Registration failed");
      }

      await syncGuestDataToUser();
      setUser(data.user);
      await loadAccountData();
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setCartItems([]);
    setOrders([]);
    setAddresses([]);
  }

  async function handleAddressSubmit(payload) {
    setAddressStatus("");
    try {
      const isEdit = Boolean(payload.id);
      const response = await fetch(isEdit ? `/api/account/addresses/${payload.id}` : "/api/account/addresses", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Unable to save address");
      }
      setAddressStatus(isEdit ? "Address updated." : "Address added.");
      await loadAccountData();
    } catch (error) {
      setAddressStatus(error.message);
    }
  }

  async function handleAddressDelete(id) {
    setAddressStatus("");
    try {
      const response = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Unable to delete address");
      }
      setAddressStatus("Address deleted.");
      await loadAccountData();
    } catch (error) {
      setAddressStatus(error.message);
    }
  }

  async function handleSaveProfile(payload, localError) {
    setProfileStatus("");
    if (localError) {
      setProfileStatus(localError);
      return;
    }

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Unable to update profile");
      }
      setUser((current) => ({ ...current, ...(data.user || {}) }));
      setProfileStatus("Profile updated successfully.");
    } catch (error) {
      setProfileStatus(error.message);
    }
  }

  return (
    <>
      <PageHeader />
      <div className={styles.accountWrapper}>
        {user ? (
          <LoggedInView
            user={user}
            cartItems={cartItems}
            orders={orders}
            addresses={addresses}
            addressStatus={addressStatus}
            profileStatus={profileStatus}
            onAddressSubmit={handleAddressSubmit}
            onAddressDelete={handleAddressDelete}
            onSaveProfile={handleSaveProfile}
            onLogout={handleLogout}
            continueCheckoutHref={continueCheckoutHref}
          />
        ) : (
          <LoggedOutView
            onLogin={handleLogin}
            onRegister={handleRegister}
            loading={loading}
            authError={authError}
            autoFocusLogin={cameFromCheckout}
          />
        )}
      </div>
    </>
  );
}
