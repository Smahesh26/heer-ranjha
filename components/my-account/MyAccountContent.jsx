"use client";
import { useState } from "react";
import { formatPrice } from "@/components/shop/shopData";
import styles from "./myAccount.module.css";

const DEMO_USER = {
  name: "Priya Sharma",
  email: "priya@example.com",
  orders: [
    { id: "HR-2025-0312", date: "14 April 2025", status: "Shipped", total: 73000, items: 2 },
    { id: "HR-2024-1891", date: "19 December 2024", status: "Delivered", total: 18000, items: 1 },
  ],
};

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "◈" },
  { key: "orders", label: "My Orders", icon: "▦" },
  { key: "addresses", label: "Addresses", icon: "◎" },
  { key: "details", label: "Account Details", icon: "✦" },
];

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

function LoggedOutView({ onLogin }) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [remember, setRemember] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = () => {
    if (!loginEmail || !loginPass) {
      setLoginError("Please enter your email and password.");
      return;
    }
    onLogin({ ...DEMO_USER, email: loginEmail });
  };

  return (
    <div className={styles.authLayout}>
      {/* Login */}
      <div className={styles.authCard}>
        <h2 className={`display ${styles.authTitle}`}>Login</h2>
        <p className={styles.authSub}>Welcome back. Sign in to your Heer Ranjha account.</p>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="login-email">Email Address</label>
          <input id="login-email" type="email" className={styles.fieldInput} placeholder="your@email.com" value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setLoginError(""); }} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="login-pass">Password</label>
          <input id="login-pass" type="password" className={styles.fieldInput} placeholder="Password" value={loginPass} onChange={(e) => { setLoginPass(e.target.value); setLoginError(""); }} />
        </div>

        {loginError && <p className={styles.fieldError} role="alert">{loginError}</p>}

        <div className={styles.rememberRow}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" className={styles.checkboxInput} checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span className={styles.checkboxMark} aria-hidden="true" />
            <span className={styles.checkboxText}>Remember me</span>
          </label>
          <a href="#" className={styles.forgotLink}>Lost your password?</a>
        </div>

        <button className={`btn ${styles.authBtn}`} onClick={handleLogin}>
          <span>Sign In</span>
          <span className="btn-arrow">&#8594;</span>
        </button>

        <p className={styles.authHint}>
          Demo: enter any email and password to sign in.
        </p>
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

        <button className={`btn ${styles.authBtn}`} onClick={() => {}}>
          <span>Create Account</span>
          <span className="btn-arrow">&#8594;</span>
        </button>
      </div>
    </div>
  );
}

function Dashboard({ user }) {
  return (
    <>
      <p className={styles.dashGreeting}>
        Hello, <strong>{user.name.split(" ")[0]}</strong>. From your account dashboard you can view your recent orders, manage your shipping and billing addresses, and edit your password and account details.
      </p>

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
              {user.orders.map((order) => (
                <tr key={order.id} className={styles.orderRow}>
                  <td className={styles.orderId}>{order.id}</td>
                  <td className={styles.orderDate}>{order.date}</td>
                  <td>
                    <span className={`${styles.orderStatus} ${order.status === "Delivered" ? styles.statusDelivered : styles.statusShipped}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className={styles.orderItems}>{order.items} piece{order.items !== 1 ? "s" : ""}</td>
                  <td className={styles.orderTotal}>{formatPrice(order.total)}</td>
                  <td>
                    <a href="/order-tracking" className={styles.orderViewLink}>Track</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function OrdersView({ user }) {
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
            {user.orders.map((order) => (
              <tr key={order.id} className={styles.orderRow}>
                <td className={styles.orderId}>{order.id}</td>
                <td className={styles.orderDate}>{order.date}</td>
                <td>
                  <span className={`${styles.orderStatus} ${order.status === "Delivered" ? styles.statusDelivered : styles.statusShipped}`}>
                    {order.status}
                  </span>
                </td>
                <td className={styles.orderItems}>{order.items} piece{order.items !== 1 ? "s" : ""}</td>
                <td className={styles.orderTotal}>{formatPrice(order.total)}</td>
                <td><a href="/order-tracking" className={styles.orderViewLink}>Track</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddressesView() {
  return (
    <div>
      <h2 className={`display ${styles.sectionTitle}`}>Addresses</h2>
      <p className={styles.sectionSub}>Saved billing and shipping addresses for faster checkout.</p>
      <div className={styles.addressGrid}>
        {["Billing Address", "Shipping Address"].map((type) => (
          <div key={type} className={styles.addressCard}>
            <h3 className={styles.addressType}>{type}</h3>
            <p className={styles.addressEmpty}>No address saved yet.</p>
            <button className={`btn ${styles.addressBtn}`}>
              <span>Add Address</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountDetailsView({ user }) {
  return (
    <div>
      <h2 className={`display ${styles.sectionTitle}`}>Account Details</h2>
      <p className={styles.sectionSub}>Update your name, email address and password.</p>
      <div className={styles.detailsForm}>
        <div className={styles.detailsRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>First Name</label>
            <input type="text" className={styles.fieldInput} defaultValue={user.name.split(" ")[0]} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Last Name</label>
            <input type="text" className={styles.fieldInput} defaultValue={user.name.split(" ")[1] || ""} />
          </div>
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Email Address</label>
          <input type="email" className={styles.fieldInput} defaultValue={user.email} />
        </div>
        <div className={styles.detailsDivider} />
        <h3 className={styles.detailsSubhead}>Change Password</h3>
        {["Current Password", "New Password", "Confirm New Password"].map((label) => (
          <div key={label} className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{label}</label>
            <input type="password" className={styles.fieldInput} placeholder={label} />
          </div>
        ))}
        <button className="btn" style={{ marginTop: "0.5rem" }}>
          <span>Save Changes</span>
          <span className="btn-arrow">&#8594;</span>
        </button>
      </div>
    </div>
  );
}

function LoggedInView({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState("dashboard");

  const renderContent = () => {
    switch (activeNav) {
      case "orders": return <OrdersView user={user} />;
      case "addresses": return <AddressesView />;
      case "details": return <AccountDetailsView user={user} />;
      default: return <Dashboard user={user} />;
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

  return (
    <>
      <PageHeader />
      <div className={styles.accountWrapper}>
        {user ? (
          <LoggedInView user={user} onLogout={() => setUser(null)} />
        ) : (
          <LoggedOutView onLogin={(u) => setUser(u)} />
        )}
      </div>
    </>
  );
}
