"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  link: "",
  position: "0",
  active: true,
  media: null,
};

const EMPTY_PRODUCT_FORM = {
  name: "",
  slug: "",
  description: "",
  category: "Men",
  subCategory: "Kurta Sets",
  collection: "Nayi Leher",
  fabric: "Matka Silk",
  sizes: "XS,S,M,L,XL,XXL",
  sizeCharges: "{}",
  clothCare: "",
  termsAndConditions: "",
  price: "",
  mrp: "",
  stock: "1",
  featured: false,
  active: true,
  images: [],
};

const SIDEBAR_ITEMS = [
  { key: "banners", label: "Banners", meta: "Upload" },
  { key: "products", label: "Products", meta: "Upload" },
  { key: "orders", label: "Orders", meta: "History" },
  { key: "payments", label: "Payments", meta: "History" },
  { key: "users", label: "Users", meta: "Registry" },
];

const VALID_SECTIONS = new Set(SIDEBAR_ITEMS.map((item) => item.key));

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
          userName: order.user?.name || "Customer",
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
      userName: order.user?.name || "Customer",
      createdAt: txn.createdAt || order.createdAt,
      paymentMode: txn.paymentMethod || order.paymentMode || "-",
      paymentStatus: txn.status || order.paymentStatus || "unpaid",
      paymentId: txn.providerPaymentId || order.razorpayPaymentId || order.paymentId || "-",
      amount: Number(txn.amount || order.total || 0),
    }));
  });

  return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function formatDate(value) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getMediaAcceptHint(file) {
  if (!file) return "Upload hero media in JPG, PNG, WEBP or MP4 format.";
  if (file.type.startsWith("video/")) return `Selected video: ${file.name}`;
  if (file.type.startsWith("image/")) return `Selected image: ${file.name}`;
  return `Selected file: ${file.name}`;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadStatus, setUploadStatus] = useState("");
  const [bannerList, setBannerList] = useState([]);
  const [refreshingBanners, setRefreshingBanners] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [productFileInputKey, setProductFileInputKey] = useState(0);
  const [productStatus, setProductStatus] = useState("");
  const [productList, setProductList] = useState([]);
  const [refreshingProducts, setRefreshingProducts] = useState(false);
  const [orderList, setOrderList] = useState([]);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [orderFilterStatus, setOrderFilterStatus] = useState("");
  const [orderFilterPayment, setOrderFilterPayment] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusMessage, setOrderStatusMessage] = useState("");
  const [userList, setUserList] = useState([]);
  const [refreshingUsers, setRefreshingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [activeSection, setActiveSection] = useState("banners");
  const [editingProductId, setEditingProductId] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    if (section && VALID_SECTIONS.has(section)) {
      setActiveSection(section);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.set("section", activeSection);
    window.history.replaceState(null, "", url.toString());
  }, [activeSection]);

  const bannerStats = useMemo(() => {
    const active = bannerList.filter((banner) => banner.active).length;
    const videos = bannerList.filter((banner) => banner.mediaType === "video").length;
    const images = bannerList.filter((banner) => banner.mediaType !== "video").length;
    return { total: bannerList.length, active, videos, images };
  }, [bannerList]);

  const productStats = useMemo(() => {
    const active = productList.filter((product) => product.active).length;
    const featured = productList.filter((product) => product.featured).length;
    const withImages = productList.filter((product) => Array.isArray(product.images) && product.images.length > 0).length;
    return { total: productList.length, active, featured, withImages };
  }, [productList]);

  const paymentRows = useMemo(() => getPaymentRows(orderList), [orderList]);

  const orderStats = useMemo(() => {
    const pending = orderList.filter((order) => String(order.status || "").toUpperCase() === "PENDING").length;
    const paid = orderList.filter((order) => String(order.paymentStatus || "").toLowerCase() === "paid").length;
    const revenue = orderList.reduce((sum, order) => sum + Number(order.total || 0), 0);
    return { total: orderList.length, pending, paid, revenue };
  }, [orderList]);

  const paymentStats = useMemo(() => {
    const paid = paymentRows.filter((row) => {
      const normalized = String(row.paymentStatus || "").toUpperCase();
      return normalized === "PAID" || normalized === "CAPTURED";
    });
    const unpaid = paymentRows.filter((row) => {
      const normalized = String(row.paymentStatus || "").toUpperCase();
      return normalized !== "PAID" && normalized !== "CAPTURED";
    });
    const amount = paid.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return { total: paymentRows.length, paid: paid.length, unpaid: unpaid.length, amount };
  }, [paymentRows]);

  const userStats = useMemo(() => {
    const customers = userList.filter((entry) => entry.role === "CUSTOMER").length;
    const admins = userList.filter((entry) => entry.role === "ADMIN").length;
    const totalSpend = userList.reduce((sum, entry) => sum + Number(entry.totalSpend || 0), 0);
    return { total: userList.length, customers, admins, totalSpend };
  }, [userList]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.user?.role === "ADMIN") {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadBanners();
    void loadProducts();
    void loadOrders();
    void loadUsers();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (activeSection !== "orders" && activeSection !== "payments") return;
    void loadOrders();
  }, [user, activeSection, orderFilterStatus, orderFilterPayment, orderSearch]);

  useEffect(() => {
    if (!user) return;
    if (activeSection !== "users") return;
    void loadUsers();
  }, [user, activeSection, userSearch]);

  async function loadBanners() {
    setRefreshingBanners(true);
    try {
      const response = await fetch("/api/banners", { cache: "no-store" });
      const data = await response.json();
      setBannerList(data.banners || []);
    } catch {
      setBannerList([]);
    } finally {
      setRefreshingBanners(false);
    }
  }

  async function loadProducts() {
    setRefreshingProducts(true);
    try {
      const response = await fetch("/api/products?active=true", { cache: "no-store" });
      const data = await response.json();
      setProductList(data.products || []);
    } catch {
      setProductList([]);
    } finally {
      setRefreshingProducts(false);
    }
  }

  async function loadOrders() {
    setRefreshingOrders(true);
    try {
      const params = new URLSearchParams({ scope: "all" });
      if (orderFilterStatus) params.set("status", orderFilterStatus);
      if (orderFilterPayment) params.set("paymentStatus", orderFilterPayment);
      if (orderSearch.trim()) params.set("q", orderSearch.trim());

      const response = await fetch(`/api/orders?${params.toString()}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({ orders: [] }));
      if (!response.ok) {
        throw new Error(data?.error || "Unable to load orders");
      }
      setOrderList(Array.isArray(data.orders) ? data.orders : []);
    } catch {
      setOrderList([]);
    } finally {
      setRefreshingOrders(false);
    }
  }

  async function loadUsers() {
    setRefreshingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.set("q", userSearch.trim());
      const query = params.toString();
      const response = await fetch(`/api/admin/users${query ? `?${query}` : ""}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({ users: [] }));
      if (!response.ok) {
        throw new Error(data?.error || "Unable to load users");
      }
      setUserList(Array.isArray(data.users) ? data.users : []);
    } catch {
      setUserList([]);
    } finally {
      setRefreshingUsers(false);
    }
  }

  async function handleOrderUpdate(orderId, payload, successMessage) {
    setOrderStatusMessage("");
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Unable to update order");
      }
      setOrderStatusMessage(successMessage);
      await loadOrders();
    } catch (error) {
      setOrderStatusMessage(error.message);
    }
  }

  async function handleExportOrders() {
    setOrderStatusMessage("");
    try {
      const response = await fetch("/api/orders/export", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.csv) {
        throw new Error(data?.error || "Unable to export orders");
      }

      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `orders-export-${Date.now()}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
      setOrderStatusMessage(`Exported ${data.count || 0} orders.`);
    } catch (error) {
      setOrderStatusMessage(error.message);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setLoginError("");
    setLoginSuccess("");

    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to sign in");
      }

      setUser(data.user);
      setLoginSuccess("Admin login successful.");
      router.refresh();
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setBannerList([]);
    setLoginEmail("");
    setLoginPassword("");
    setLoginSuccess("");
    setUploadStatus("");
    setProductStatus("");
    setForm(EMPTY_FORM);
    setProductForm(EMPTY_PRODUCT_FORM);
    setProductList([]);
    setOrderList([]);
    setFileInputKey((key) => key + 1);
    setProductFileInputKey((key) => key + 1);
  }

  async function handleBannerUpload(event) {
    event.preventDefault();
    setUploadStatus("");

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("subtitle", form.subtitle);
    formData.append("link", form.link);
    formData.append("position", form.position);
    formData.append("active", form.active ? "true" : "false");
    if (form.media) {
      formData.append("media", form.media);
    }

    try {
      const response = await fetch("/api/banners", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Banner upload failed");
      }

      setUploadStatus("Banner uploaded successfully.");
      setForm(EMPTY_FORM);
      setFileInputKey((key) => key + 1);
      await loadBanners();
    } catch (error) {
      setUploadStatus(error.message);
    }
  }

  async function handleProductUpload(event) {
    event.preventDefault();
    setProductStatus("");

    const formData = new FormData();
    formData.append("name", productForm.name);
    formData.append("slug", productForm.slug);
    formData.append("description", productForm.description);
    formData.append("category", productForm.category);
    formData.append("subCategory", productForm.subCategory);
    formData.append("collection", productForm.collection);
    formData.append("fabric", productForm.fabric);
    formData.append("sizes", productForm.sizes);
    formData.append("sizeCharges", productForm.sizeCharges);
    formData.append("clothCare", productForm.clothCare);
    formData.append("termsAndConditions", productForm.termsAndConditions);
    formData.append("price", productForm.price);
    formData.append("mrp", productForm.mrp);
    formData.append("stock", productForm.stock);
    formData.append("featured", productForm.featured ? "true" : "false");
    formData.append("active", productForm.active ? "true" : "false");

    for (const file of productForm.images) {
      formData.append("images", file);
    }

    try {
      const isEditing = Boolean(editingProductId);
      const response = await fetch(isEditing ? `/api/products/${editingProductId}` : "/api/products", {
        method: isEditing ? "PATCH" : "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Product upload failed");
      }

      setProductStatus(isEditing ? "Product updated successfully." : "Product uploaded successfully.");
      setProductForm(EMPTY_PRODUCT_FORM);
      setProductFileInputKey((key) => key + 1);
      setEditingProductId(null);
      await loadProducts();
    } catch (error) {
      setProductStatus(error.message);
    }
  }

  function handleEditProduct(product) {
    setActiveSection("products");
    setEditingProductId(product.id);
    setProductStatus("Edit mode enabled. Update fields and click Save Changes.");
    setProductForm({
      name: product.name || "",
      slug: product.slug || "",
      description: product.description || "",
      category: product.category || "Men",
      subCategory: product.subCategory || "Kurta Sets",
      collection: product.collection || "Nayi Leher",
      fabric: product.fabric || "Matka Silk",
      sizes: Array.isArray(product.sizes) && product.sizes.length ? product.sizes.join(",") : "XS,S,M,L,XL,XXL",
      sizeCharges: JSON.stringify(product.sizeCharges || {}),
      clothCare: product.clothCare || "",
      termsAndConditions: product.termsAndConditions || "",
      price: String(product.price ?? ""),
      mrp: product.mrp != null ? String(product.mrp) : "",
      stock: String(product.stock ?? "0"),
      featured: Boolean(product.featured),
      active: Boolean(product.active),
      images: [],
    });
    setProductFileInputKey((key) => key + 1);
  }

  function clearProductForm() {
    setEditingProductId(null);
    setProductStatus("");
    setProductForm(EMPTY_PRODUCT_FORM);
    setProductFileInputKey((key) => key + 1);
  }

  async function handleDeleteProduct(product) {
    const shouldDelete = window.confirm(`Delete product \"${product.name}\"? This cannot be undone.`);
    if (!shouldDelete) return;

    setDeletingProductId(product.id);
    setProductStatus("");

    try {
      const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      if (editingProductId === product.id) {
        clearProductForm();
      }
      setProductStatus(data?.archived ? (data?.message || "Product archived successfully.") : "Product deleted successfully.");
      await loadProducts();
    } catch (error) {
      setProductStatus(error.message);
    } finally {
      setDeletingProductId(null);
    }
  }

  if (!user) {
    return (
      <main className={styles.loginShell}>
        <div className={styles.loginBackdrop} aria-hidden="true" />
        <section className={styles.loginPanel}>
          <div className={styles.loginIntro}>
            <p className="eyebrow">Admin</p>
            <h1 className={`display ${styles.loginTitle}`}>Banner Upload Panel</h1>
            <p className={styles.loginCopy}>Simple panel to upload and manage homepage banner image/video files.</p>

            <div className={styles.loginHighlights}>
              <div className={styles.highlightCard}>
                <span className={styles.highlightValue}>01</span>
                <span className={styles.highlightLabel}>Stats</span>
              </div>
              <div className={styles.highlightCard}>
                <span className={styles.highlightValue}>02</span>
                <span className={styles.highlightLabel}>Banner List</span>
              </div>
              <div className={styles.highlightCard}>
                <span className={styles.highlightValue}>03</span>
                <span className={styles.highlightLabel}>Upload Form</span>
              </div>
            </div>
          </div>

          <form className={styles.loginForm} onSubmit={handleLogin}>
            <p className="eyebrow">Login</p>
            <h2 className={`display ${styles.loginFormTitle}`}>Admin Login</h2>
            <p className={styles.loginFormCopy}>Sign in to open banner upload dashboard.</p>

            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Email</span>
              <input className={styles.fieldInput} value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} type="email" required />
            </label>

            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Password</span>
              <input className={styles.fieldInput} value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} type="password" required />
            </label>

            {loginError ? <p className={styles.errorText}>{loginError}</p> : null}
            {loginSuccess ? <p className={styles.successText}>{loginSuccess}</p> : null}

            <button className="btn btn-ivory" type="submit" disabled={loading}>
              <span>{loading ? "Signing In..." : "Login"}</span>
              <span className="btn-arrow">→</span>
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.dashboardPage}>
      <div className={styles.dashboardShell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <p className="eyebrow">Heer Ranjha</p>
            <h1 className={`display ${styles.sidebarTitle}`}>Content Admin</h1>
            <p className={styles.sidebarCopy}>Manage homepage banners and product uploads.</p>
          </div>

          <nav className={styles.sidebarNav} aria-label="Admin sections">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ""}`}
                  onClick={() => setActiveSection(item.key)}
                >
                  <span className={styles.sidebarItemMeta}>{item.meta}</span>
                  <span className={`display ${styles.sidebarItemLabel}`}>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <div>
              <p className={styles.userName}>{user.name}</p>
              <p className={styles.userEmail}>{user.email}</p>
            </div>
            <button type="button" className={`btn ${styles.sidebarLogout}`} onClick={handleLogout}>
              <span>Logout</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </aside>

        <section className={styles.mainPanel}>
          <header className={styles.heroCard}>
            <div>
              <p className="eyebrow">Dashboard</p>
              <h2 className={`display ${styles.heroTitle}`}>
                {activeSection === "banners"
                  ? "Banner Upload Dashboard"
                  : activeSection === "products"
                    ? "Product Upload Dashboard"
                    : activeSection === "orders"
                      ? "Order History Dashboard"
                      : activeSection === "payments"
                        ? "Payment History Dashboard"
                        : "User Registry Dashboard"}
              </h2>
              <p className={styles.heroCopy}>
                {activeSection === "banners"
                  ? "View stats, check uploaded banners, and add new banner files."
                  : activeSection === "products"
                    ? "View product stats, check uploaded products, and add new product files."
                    : activeSection === "orders"
                      ? "Track all customer orders, statuses, and fulfillment data."
                      : activeSection === "payments"
                        ? "Track transaction flow, payment statuses, and received amount."
                        : "View registered users and account information collected at signup."}
              </p>
            </div>

            <div className={styles.statsGrid}>
              {activeSection === "banners" ? (
                <>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{bannerStats.total}</span>
                    <span className={styles.statLabel}>Total</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{bannerStats.active}</span>
                    <span className={styles.statLabel}>Active</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{bannerStats.videos}</span>
                    <span className={styles.statLabel}>Videos</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{bannerStats.images}</span>
                    <span className={styles.statLabel}>Images</span>
                  </div>
                </>
              ) : activeSection === "products" ? (
                <>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{productStats.total}</span>
                    <span className={styles.statLabel}>Total</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{productStats.active}</span>
                    <span className={styles.statLabel}>Active</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{productStats.featured}</span>
                    <span className={styles.statLabel}>Featured</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{productStats.withImages}</span>
                    <span className={styles.statLabel}>With Images</span>
                  </div>
                </>
              ) : activeSection === "orders" ? (
                <>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{orderStats.total}</span>
                    <span className={styles.statLabel}>Orders</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{orderStats.pending}</span>
                    <span className={styles.statLabel}>Pending</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{orderStats.paid}</span>
                    <span className={styles.statLabel}>Paid</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>INR {Math.round(orderStats.revenue).toLocaleString("en-IN")}</span>
                    <span className={styles.statLabel}>Gross</span>
                  </div>
                </>
              ) : activeSection === "payments" ? (
                <>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{paymentStats.total}</span>
                    <span className={styles.statLabel}>Transactions</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{paymentStats.paid}</span>
                    <span className={styles.statLabel}>Paid</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{paymentStats.unpaid}</span>
                    <span className={styles.statLabel}>Unpaid</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>INR {Math.round(paymentStats.amount).toLocaleString("en-IN")}</span>
                    <span className={styles.statLabel}>Collected</span>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{userStats.total}</span>
                    <span className={styles.statLabel}>Users</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{userStats.customers}</span>
                    <span className={styles.statLabel}>Customers</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{userStats.admins}</span>
                    <span className={styles.statLabel}>Admins</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>INR {Math.round(userStats.totalSpend).toLocaleString("en-IN")}</span>
                    <span className={styles.statLabel}>Paid Spend</span>
                  </div>
                </>
              )}
            </div>
          </header>

          {activeSection === "banners" ? <div className={styles.contentGrid}>
            <section className={styles.bannerPanel}>
              <div className={styles.sectionHead}>
                <div>
                  <p className="eyebrow">Banners</p>
                  <h3 className={`display ${styles.sectionTitle}`}>Uploaded Banners</h3>
                </div>
                <button type="button" className={`btn ${styles.refreshBtn}`} onClick={loadBanners}>
                  <span>{refreshingBanners ? "Refreshing..." : "Refresh"}</span>
                  <span className="btn-arrow">→</span>
                </button>
              </div>

              {bannerList.length ? (
                <div className={styles.bannerGrid}>
                  {bannerList.map((banner) => (
                    <article key={banner.id} className={styles.bannerCard}>
                      <div className={styles.bannerMediaWrap}>
                        {banner.image ? banner.mediaType === "video" ? (
                          <video className={styles.bannerMedia} src={banner.image} controls />
                        ) : (
                          <img className={styles.bannerMedia} src={banner.image} alt={banner.title} />
                        ) : (
                          <div className={styles.bannerFallback}>No media</div>
                        )}
                        <div className={styles.bannerBadges}>
                          <span className={styles.badge}>{banner.mediaType || "image"}</span>
                          <span className={styles.badge}>{banner.active ? "active" : "draft"}</span>
                        </div>
                      </div>

                      <div className={styles.bannerBody}>
                        <div>
                          <p className={styles.bannerMeta}>Position {banner.position ?? 0}</p>
                          <h4 className={`display ${styles.bannerTitle}`}>{banner.title}</h4>
                          {banner.subtitle ? <p className={styles.bannerSubtitle}>{banner.subtitle}</p> : null}
                        </div>

                        <div className={styles.bannerFoot}>
                          <span>{formatDate(banner.createdAt)}</span>
                          {banner.link ? <a href={banner.link} className={styles.bannerLink} target="_blank" rel="noreferrer">View link</a> : <span>No link</span>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={styles.placeholderState}>
                  <p className="eyebrow">Empty</p>
                  <h4 className={`display ${styles.placeholderTitle}`}>No banners uploaded yet.</h4>
                  <p className={styles.placeholderCopy}>Use the form to upload your first banner.</p>
                </div>
              )}
            </section>

            <aside className={styles.formPanel}>
              <div className={styles.sectionHeadCompact}>
                <p className="eyebrow">Form</p>
                <h3 className={`display ${styles.sectionTitle}`}>Upload Banner</h3>
              </div>

              <form className={styles.form} onSubmit={handleBannerUpload}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Title</span>
                  <input className={styles.fieldInput} placeholder="Banner title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
                </label>

                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Subtitle</span>
                  <textarea className={styles.fieldTextarea} placeholder="Optional subtitle" value={form.subtitle} onChange={(event) => setForm((current) => ({ ...current, subtitle: event.target.value }))} rows={4} />
                </label>

                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Link URL</span>
                  <input className={styles.fieldInput} placeholder="/shop or full URL" value={form.link} onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))} />
                </label>

                <div className={styles.inlineFields}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Position</span>
                    <input className={styles.fieldInput} type="number" min="0" value={form.position} onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))} />
                  </label>

                  <label className={`${styles.fieldGroup} ${styles.checkboxGroup}`}>
                    <span className={styles.fieldLabel}>Visibility</span>
                    <span className={styles.toggleWrap}>
                      <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
                      <span>{form.active ? "Active" : "Draft"}</span>
                    </span>
                  </label>
                </div>

                <label className={`${styles.fieldGroup} ${styles.uploadField}`}>
                  <span className={styles.fieldLabel}>Image or MP4</span>
                  <input key={fileInputKey} className={styles.fileInput} type="file" accept="image/*,video/mp4,video/webm" onChange={(event) => setForm((current) => ({ ...current, media: event.target.files?.[0] || null }))} />
                  <span className={styles.uploadHint}>{getMediaAcceptHint(form.media)}</span>
                </label>

                <button className={`btn ${styles.submitBtn}`} type="submit">
                  <span>Upload Banner</span>
                  <span className="btn-arrow">→</span>
                </button>

                {uploadStatus ? <p className={styles.successText}>{uploadStatus}</p> : null}
              </form>
            </aside>
          </div> : null}

          {activeSection === "products" ? <div className={styles.contentGrid}>
            <section className={styles.bannerPanel}>
              <div className={styles.sectionHead}>
                <div>
                  <p className="eyebrow">Products</p>
                  <h3 className={`display ${styles.sectionTitle}`}>Uploaded Products</h3>
                </div>
                <button type="button" className={`btn ${styles.refreshBtn}`} onClick={loadProducts}>
                  <span>{refreshingProducts ? "Refreshing..." : "Refresh"}</span>
                  <span className="btn-arrow">→</span>
                </button>
              </div>

              {productList.length ? (
                <div className={styles.productGrid}>
                  {productList.map((product) => (
                    <article key={product.id} className={styles.productCard}>
                      <div className={styles.productMediaWrap}>
                        {product.images?.[0] ? (
                          <img className={styles.productMedia} src={product.images[0]} alt={product.name} />
                        ) : (
                          <div className={styles.bannerFallback}>No image</div>
                        )}
                      </div>

                      <div className={styles.productBody}>
                        <div>
                          <h4 className={`display ${styles.bannerTitle}`}>{product.name}</h4>
                          <p className={styles.bannerMeta}>/{product.slug}</p>
                          <p className={styles.bannerSubtitle}>{product.collection} • {product.subCategory}</p>
                        </div>
                        <div className={styles.bannerFoot}>
                          <span>INR {Number(product.price || 0).toLocaleString("en-IN")}</span>
                          <span>{product.active ? "Active" : "Draft"}</span>
                        </div>
                        <div className={styles.productActions}>
                          <button type="button" className={styles.ghostBtn} onClick={() => handleEditProduct(product)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className={styles.dangerBtn}
                            onClick={() => handleDeleteProduct(product)}
                            disabled={deletingProductId === product.id}
                          >
                            {deletingProductId === product.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={styles.placeholderState}>
                  <p className="eyebrow">Empty</p>
                  <h4 className={`display ${styles.placeholderTitle}`}>No products uploaded yet.</h4>
                  <p className={styles.placeholderCopy}>Use the form to upload your first product.</p>
                </div>
              )}
            </section>

            <aside className={styles.formPanel}>
              <div className={styles.sectionHeadCompact}>
                <p className="eyebrow">Form</p>
                <h3 className={`display ${styles.sectionTitle}`}>{editingProductId ? "Edit Product" : "Upload Product"}</h3>
              </div>

              <form className={styles.form} onSubmit={handleProductUpload}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Product Name</span>
                  <input className={styles.fieldInput} value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} required />
                </label>

                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Slug</span>
                  <input className={styles.fieldInput} placeholder="pink-matka-kurta-set" value={productForm.slug} onChange={(event) => setProductForm((current) => ({ ...current, slug: event.target.value }))} required />
                </label>

                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Description</span>
                  <textarea className={styles.fieldTextarea} rows={4} value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} required />
                </label>

                <div className={styles.inlineFields}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Category</span>
                    <input className={styles.fieldInput} value={productForm.category} onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))} required />
                  </label>

                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Sub Category</span>
                    <input className={styles.fieldInput} value={productForm.subCategory} onChange={(event) => setProductForm((current) => ({ ...current, subCategory: event.target.value }))} required />
                  </label>
                </div>

                <div className={styles.inlineFields}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Collection</span>
                    <input className={styles.fieldInput} value={productForm.collection} onChange={(event) => setProductForm((current) => ({ ...current, collection: event.target.value }))} required />
                  </label>

                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Fabric</span>
                    <input className={styles.fieldInput} value={productForm.fabric} onChange={(event) => setProductForm((current) => ({ ...current, fabric: event.target.value }))} required />
                  </label>
                </div>

                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Sizes (comma separated)</span>
                  <input className={styles.fieldInput} placeholder="XS,S,M,L,XL,XXL" value={productForm.sizes} onChange={(event) => setProductForm((current) => ({ ...current, sizes: event.target.value }))} />
                </label>

                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Size Charges (JSON)</span>
                  <input className={styles.fieldInput} placeholder='{"XL": 200, "XXL": 400}' value={productForm.sizeCharges} onChange={(event) => setProductForm((current) => ({ ...current, sizeCharges: event.target.value }))} />
                </label>

                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Cloth Care Instructions</span>
                  <textarea className={styles.fieldTextarea} rows={3} value={productForm.clothCare} onChange={(event) => setProductForm((current) => ({ ...current, clothCare: event.target.value }))} />
                </label>

                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Terms and Conditions</span>
                  <textarea className={styles.fieldTextarea} rows={4} value={productForm.termsAndConditions} onChange={(event) => setProductForm((current) => ({ ...current, termsAndConditions: event.target.value }))} />
                </label>

                <div className={styles.inlineFields}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Price</span>
                    <input className={styles.fieldInput} type="number" min="0" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} required />
                  </label>

                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>MRP</span>
                    <input className={styles.fieldInput} type="number" min="0" value={productForm.mrp} onChange={(event) => setProductForm((current) => ({ ...current, mrp: event.target.value }))} />
                  </label>
                </div>

                <div className={styles.inlineFields}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Stock</span>
                    <input className={styles.fieldInput} type="number" min="0" value={productForm.stock} onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))} required />
                  </label>

                  <label className={`${styles.fieldGroup} ${styles.checkboxGroup}`}>
                    <span className={styles.fieldLabel}>Featured</span>
                    <span className={styles.toggleWrap}>
                      <input type="checkbox" checked={productForm.featured} onChange={(event) => setProductForm((current) => ({ ...current, featured: event.target.checked }))} />
                      <span>{productForm.featured ? "Yes" : "No"}</span>
                    </span>
                  </label>
                </div>

                <label className={`${styles.fieldGroup} ${styles.checkboxGroup}`}>
                  <span className={styles.fieldLabel}>Visibility</span>
                  <span className={styles.toggleWrap}>
                    <input type="checkbox" checked={productForm.active} onChange={(event) => setProductForm((current) => ({ ...current, active: event.target.checked }))} />
                    <span>{productForm.active ? "Active" : "Draft"}</span>
                  </span>
                </label>

                <label className={`${styles.fieldGroup} ${styles.uploadField}`}>
                  <span className={styles.fieldLabel}>{editingProductId ? "Replace Product Images" : "Product Images"}</span>
                  <input key={productFileInputKey} className={styles.fileInput} type="file" accept="image/*" multiple onChange={(event) => setProductForm((current) => ({ ...current, images: Array.from(event.target.files || []).slice(0, 5) }))} />
                  <span className={styles.uploadHint}>{productForm.images.length ? `${productForm.images.length}/5 image(s) selected` : editingProductId ? "Optional: choose up to 5 images. Leave empty to keep existing images." : "Optional: upload up to 5 product images."}</span>
                </label>

                <button className={`btn ${styles.submitBtn}`} type="submit">
                  <span>{editingProductId ? "Save Changes" : "Upload Product"}</span>
                  <span className="btn-arrow">→</span>
                </button>

                {editingProductId ? (
                  <button type="button" className={styles.ghostBtn} onClick={clearProductForm}>
                    Cancel Edit
                  </button>
                ) : null}

                {productStatus ? <p className={styles.successText}>{productStatus}</p> : null}
              </form>
            </aside>
          </div> : null}

          {activeSection === "orders" ? <div className={styles.contentGrid}>
            <section className={styles.bannerPanel}>
              <div className={styles.sectionHead}>
                <div>
                  <p className="eyebrow">Orders</p>
                  <h3 className={`display ${styles.sectionTitle}`}>All Customer Orders</h3>
                </div>
                <div className={styles.productActions}>
                  <button type="button" className={`btn ${styles.refreshBtn}`} onClick={loadOrders}>
                    <span>{refreshingOrders ? "Refreshing..." : "Refresh"}</span>
                    <span className="btn-arrow">→</span>
                  </button>
                  <button type="button" className={styles.ghostBtn} onClick={handleExportOrders}>
                    Export CSV
                  </button>
                </div>
              </div>

              {orderList.length ? (
                <div className={styles.productGrid}>
                  {orderList.map((order) => (
                    <article key={order.id} className={styles.productCard}>
                      <div className={styles.productBody}>
                        <div>
                          <p className={styles.bannerMeta}>{formatDate(order.createdAt)}</p>
                          <h4 className={`display ${styles.bannerTitle}`}>{order.orderNumber || order.id}</h4>
                          <p className={styles.bannerSubtitle}>{order.user?.name || "Customer"} • {order.user?.email || "-"}</p>
                          <p className={styles.bannerMeta}>Status: {String(order.status || "pending").toLowerCase()} • Payment: {String(order.paymentStatus || "unpaid").toLowerCase()}</p>
                        </div>
                        <div className={styles.bannerFoot}>
                          <span>{getOrderItemCount(order)} item(s)</span>
                          <span>INR {Number(order.total || 0).toLocaleString("en-IN")}</span>
                        </div>
                        <div className={styles.productActions}>
                          <button type="button" className={styles.ghostBtn} onClick={() => handleOrderUpdate(order.id, { status: "SHIPPED" }, "Order marked as shipped.")}>Mark Shipped</button>
                          <button type="button" className={styles.ghostBtn} onClick={() => handleOrderUpdate(order.id, { status: "DELIVERED" }, "Order marked as delivered.")}>Mark Delivered</button>
                          <button type="button" className={styles.ghostBtn} onClick={() => handleOrderUpdate(order.id, { paymentStatus: "paid" }, "Payment status marked paid.")}>Mark Paid</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={styles.placeholderState}>
                  <p className="eyebrow">Empty</p>
                  <h4 className={`display ${styles.placeholderTitle}`}>No orders available.</h4>
                  <p className={styles.placeholderCopy}>Orders will appear here once customers place them.</p>
                </div>
              )}
            </section>

            <aside className={styles.formPanel}>
              <div className={styles.sectionHeadCompact}>
                <p className="eyebrow">Overview</p>
                <h3 className={`display ${styles.sectionTitle}`}>Order Snapshot</h3>
              </div>
              <div className={styles.form}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Search</span>
                  <input className={styles.fieldInput} placeholder="Order no, email, customer" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} />
                </label>
                <div className={styles.inlineFields}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Status</span>
                    <select className={styles.fieldInput} value={orderFilterStatus} onChange={(event) => setOrderFilterStatus(event.target.value)}>
                      <option value="">All</option>
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </label>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Payment</span>
                    <select className={styles.fieldInput} value={orderFilterPayment} onChange={(event) => setOrderFilterPayment(event.target.value)}>
                      <option value="">All</option>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                  </label>
                </div>
                {orderStatusMessage ? <p className={styles.successText}>{orderStatusMessage}</p> : null}
              </div>
              <div className={styles.form}>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{orderStats.total}</span>
                  <span className={styles.statLabel}>Total Orders</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{orderStats.pending}</span>
                  <span className={styles.statLabel}>Pending Fulfillment</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{orderStats.paid}</span>
                  <span className={styles.statLabel}>Paid Orders</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>INR {Math.round(orderStats.revenue).toLocaleString("en-IN")}</span>
                  <span className={styles.statLabel}>Gross Order Value</span>
                </div>
              </div>
            </aside>
          </div> : null}

          {activeSection === "payments" ? <div className={styles.contentGrid}>
            <section className={styles.bannerPanel}>
              <div className={styles.sectionHead}>
                <div>
                  <p className="eyebrow">Payments</p>
                  <h3 className={`display ${styles.sectionTitle}`}>Payment History</h3>
                </div>
                <button type="button" className={`btn ${styles.refreshBtn}`} onClick={loadOrders}>
                  <span>{refreshingOrders ? "Refreshing..." : "Refresh"}</span>
                  <span className="btn-arrow">→</span>
                </button>
              </div>

              {paymentRows.length ? (
                <div className={styles.productGrid}>
                  {paymentRows.map((payment) => (
                    <article key={`payment-${payment.key}`} className={styles.productCard}>
                      <div className={styles.productBody}>
                        <div>
                          <p className={styles.bannerMeta}>{formatDate(payment.createdAt)}</p>
                          <h4 className={`display ${styles.bannerTitle}`}>{payment.orderNumber}</h4>
                          <p className={styles.bannerSubtitle}>{payment.paymentMode || "N/A"} • {payment.paymentId || "No payment id"}</p>
                          <p className={styles.bannerMeta}>Payment Status: {String(payment.paymentStatus || "unpaid").toLowerCase()}</p>
                        </div>
                        <div className={styles.bannerFoot}>
                          <span>{payment.userName || "Customer"}</span>
                          <span>INR {Number(payment.amount || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={styles.placeholderState}>
                  <p className="eyebrow">Empty</p>
                  <h4 className={`display ${styles.placeholderTitle}`}>No payments recorded.</h4>
                  <p className={styles.placeholderCopy}>Payment transactions will appear after checkout confirmations.</p>
                </div>
              )}
            </section>

            <aside className={styles.formPanel}>
              <div className={styles.sectionHeadCompact}>
                <p className="eyebrow">Overview</p>
                <h3 className={`display ${styles.sectionTitle}`}>Payment Snapshot</h3>
              </div>
              <div className={styles.form}>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{paymentStats.total}</span>
                  <span className={styles.statLabel}>Total Transactions</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{paymentStats.paid}</span>
                  <span className={styles.statLabel}>Paid</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{paymentStats.unpaid}</span>
                  <span className={styles.statLabel}>Unpaid</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>INR {Math.round(paymentStats.amount).toLocaleString("en-IN")}</span>
                  <span className={styles.statLabel}>Collected Amount</span>
                </div>
              </div>
            </aside>
          </div> : null}

          {activeSection === "users" ? <div className={styles.contentGrid}>
            <section className={styles.bannerPanel}>
              <div className={styles.sectionHead}>
                <div>
                  <p className="eyebrow">Users</p>
                  <h3 className={`display ${styles.sectionTitle}`}>Registered Users</h3>
                </div>
                <button type="button" className={`btn ${styles.refreshBtn}`} onClick={loadUsers}>
                  <span>{refreshingUsers ? "Refreshing..." : "Refresh"}</span>
                  <span className="btn-arrow">→</span>
                </button>
              </div>

              {userList.length ? (
                <div className={styles.productGrid}>
                  {userList.map((entry) => (
                    <article key={entry.id} className={styles.productCard}>
                      <div className={styles.productBody}>
                        <div>
                          <p className={styles.bannerMeta}>Joined {formatDate(entry.createdAt)}</p>
                          <h4 className={`display ${styles.bannerTitle}`}>{entry.name || "Unnamed User"}</h4>
                          <p className={styles.bannerSubtitle}>{entry.email}</p>
                          <p className={styles.bannerMeta}>Role: {String(entry.role || "CUSTOMER").toLowerCase()} • Phone: {entry.phone || "Not provided"}</p>
                        </div>
                        <div className={styles.bannerFoot}>
                          <span>{entry.orderCount || 0} order(s)</span>
                          <span>INR {Number(entry.totalSpend || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={styles.placeholderState}>
                  <p className="eyebrow">Empty</p>
                  <h4 className={`display ${styles.placeholderTitle}`}>No users found.</h4>
                  <p className={styles.placeholderCopy}>Users will appear here once accounts are created.</p>
                </div>
              )}
            </section>

            <aside className={styles.formPanel}>
              <div className={styles.sectionHeadCompact}>
                <p className="eyebrow">Overview</p>
                <h3 className={`display ${styles.sectionTitle}`}>User Snapshot</h3>
              </div>
              <div className={styles.form}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Search</span>
                  <input className={styles.fieldInput} placeholder="Name, email, phone" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} />
                </label>
              </div>
              <div className={styles.form}>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{userStats.total}</span>
                  <span className={styles.statLabel}>Total Users</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{userStats.customers}</span>
                  <span className={styles.statLabel}>Customers</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{userStats.admins}</span>
                  <span className={styles.statLabel}>Admins</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>INR {Math.round(userStats.totalSpend).toLocaleString("en-IN")}</span>
                  <span className={styles.statLabel}>Total Paid Spend</span>
                </div>
              </div>
            </aside>
          </div> : null}
        </section>
      </div>
    </main>
  );
}