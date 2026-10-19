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
  sku: "",
  slug: "",
  collection: "ASAYA",
  category: "Men's Wear",
  subCategory: "Kurta",
  setIncludes: "1 Kurta",
  fabric: "Matka Silk",
  washCare: "Dry Clean Only",
  color: "",
  fit: "Regular",
  price: "",
  mrp: "",
  stock: "MTO",
  sizes: "XS,S,M,L,XL,XXL",
  description: "",
  shippingDetails: "Free shipping across India on all orders. Made-To-Order Timeline: 2-3 Weeks.",
  disclaimer: "Slight variations in colour, texture, embroidery and finish may occur due to the handcrafted nature of the ensembles. Products colours may vary slightly due to lighting and screen settings.",
  termsAndConditions: "",
  imageUrls: "",
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
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [deletingBannerId, setDeletingBannerId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [importingExcel, setImportingExcel] = useState(false);
  const [excelStatus, setExcelStatus] = useState("");
  const [excelFileInputKey, setExcelFileInputKey] = useState(0);
  const [productSearch, setProductSearch] = useState("");

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

  const filteredProducts = useMemo(() => {
    if (!productSearch) return productList;
    const q = productSearch.toLowerCase();
    return productList.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.collection || "").toLowerCase().includes(q) ||
        (p.subCategory || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
  }, [productList, productSearch]);

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
      const response = await fetch("/api/products", { cache: "no-store" });
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
    setEditingBannerId(null);
    setDeletingBannerId(null);
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

  function clearBannerForm() {
    setEditingBannerId(null);
    setUploadStatus("");
    setForm(EMPTY_FORM);
    setFileInputKey((key) => key + 1);
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
      const isEditing = Boolean(editingBannerId);
      const response = await fetch(isEditing ? `/api/banners/${editingBannerId}` : "/api/banners", {
        method: isEditing ? "PATCH" : "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Banner save failed");
      }

      setUploadStatus(isEditing ? "Banner updated successfully." : "Banner uploaded successfully.");
      clearBannerForm();
      await loadBanners();
    } catch (error) {
      setUploadStatus(error.message);
    }
  }

  function handleEditBanner(banner) {
    setActiveSection("banners");
    setEditingBannerId(banner.id);
    setUploadStatus("Edit mode enabled. Update fields and click Save Changes.");
    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      link: banner.link || "",
      position: String(banner.position ?? 0),
      active: Boolean(banner.active),
      media: null,
    });
    setFileInputKey((key) => key + 1);
  }

  async function handleDeleteBanner(banner) {
    const shouldDelete = window.confirm(`Delete banner \"${banner.title}\"? This cannot be undone.`);
    if (!shouldDelete) return;

    setDeletingBannerId(banner.id);
    setUploadStatus("");

    try {
      const response = await fetch(`/api/banners/${banner.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      if (editingBannerId === banner.id) {
        clearBannerForm();
      }
      setUploadStatus("Banner deleted successfully.");
      await loadBanners();
    } catch (error) {
      setUploadStatus(error.message);
    } finally {
      setDeletingBannerId(null);
    }
  }

  async function handleImportExcel(event) {
    if (event) event.preventDefault();
    if (!excelFile) {
      setExcelStatus("Please select an .xlsx or .xls file first.");
      return;
    }
    setImportingExcel(true);
    setExcelStatus("Processing Excel file and importing products...");

    try {
      const formData = new FormData();
      formData.append("file", excelFile);

      const response = await fetch("/api/products/import-excel", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Excel import failed");
      }

      setExcelStatus(data.message || "Excel sheet imported successfully!");
      setExcelFile(null);
      setExcelFileInputKey((k) => k + 1);
      await loadProducts();
    } catch (err) {
      setExcelStatus(err.message || "Failed to import Excel.");
    } finally {
      setImportingExcel(false);
    }
  }

  function handleExportExcel() {
    window.open("/api/products/import-excel", "_blank");
  }

  async function handleProductUpload(event) {
    event.preventDefault();
    setProductStatus("");

    const formData = new FormData();
    formData.append("name", productForm.name);
    formData.append("sku", productForm.sku);
    formData.append("slug", productForm.slug);
    formData.append("collection", productForm.collection);
    formData.append("category", productForm.category);
    formData.append("subCategory", productForm.subCategory);
    formData.append("setIncludes", productForm.setIncludes);
    formData.append("fabric", productForm.fabric);
    formData.append("washCare", productForm.washCare);
    formData.append("color", productForm.color);
    formData.append("fit", productForm.fit);
    formData.append("price", productForm.price);
    formData.append("mrp", productForm.mrp);
    formData.append("stock", productForm.stock);
    formData.append("sizes", productForm.sizes);
    formData.append("description", productForm.description);
    formData.append("shippingDetails", productForm.shippingDetails);
    formData.append("disclaimer", productForm.disclaimer);
    formData.append("termsAndConditions", productForm.termsAndConditions);
    formData.append("imageUrls", productForm.imageUrls);
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
    setEditingProductId(product.id || product.slug);
    setProductStatus("Edit mode enabled. Update fields and click Save Changes.");
    setProductForm({
      name: product.name || "",
      sku: product.sku || product.styleCode || "",
      slug: product.slug || product.id || "",
      collection: product.collection || "ASAYA",
      category: product.category || "Men's Wear",
      subCategory: product.subCategory || "Kurta",
      setIncludes: product.setIncludes || "1 Kurta",
      fabric: product.fabric || "Matka Silk",
      washCare: product.washCare || product.clothCare || "Dry Clean Only",
      color: product.color || "",
      fit: product.fit || "Regular",
      price: String(product.price ?? ""),
      mrp: product.mrp != null ? String(product.mrp) : String(product.price ?? ""),
      stock: String(product.stock ?? "MTO"),
      sizes: Array.isArray(product.sizes) && product.sizes.length ? product.sizes.join(",") : (product.sizes || "XS,S,M,L,XL,XXL"),
      description: product.description || "",
      shippingDetails: product.shippingDetails || "",
      disclaimer: product.disclaimer || "",
      termsAndConditions: product.termsAndConditions || "",
      imageUrls: Array.isArray(product.images) ? product.images.join("\n") : (product.images || ""),
      featured: Boolean(product.featured),
      active: product.active !== undefined ? Boolean(product.active) : true,
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

                        <div className={styles.productActions}>
                          <button type="button" className={styles.ghostBtn} onClick={() => handleEditBanner(banner)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className={styles.dangerBtn}
                            onClick={() => handleDeleteBanner(banner)}
                            disabled={deletingBannerId === banner.id}
                          >
                            {deletingBannerId === banner.id ? "Deleting..." : "Delete"}
                          </button>
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
                <h3 className={`display ${styles.sectionTitle}`}>{editingBannerId ? "Edit Banner" : "Upload Banner"}</h3>
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
                  <span className={styles.fieldLabel}>{editingBannerId ? "Replace Image or MP4 (optional)" : "Image or MP4"}</span>
                  <input key={fileInputKey} className={styles.fileInput} type="file" accept="image/*,video/mp4,video/webm" onChange={(event) => setForm((current) => ({ ...current, media: event.target.files?.[0] || null }))} />
                  <span className={styles.uploadHint}>{getMediaAcceptHint(form.media)}</span>
                </label>

                <button className={`btn ${styles.submitBtn}`} type="submit">
                  <span>{editingBannerId ? "Save Changes" : "Upload Banner"}</span>
                  <span className="btn-arrow">→</span>
                </button>

                {editingBannerId ? (
                  <button type="button" className={styles.ghostBtn} onClick={clearBannerForm}>
                    Cancel Edit
                  </button>
                ) : null}

                {uploadStatus ? <p className={styles.successText}>{uploadStatus}</p> : null}
              </form>
            </aside>
          </div> : null}

          {activeSection === "products" ? (
            <div className={styles.mainProductsSection}>
              {/* Excel Bulk Upload & Export Box */}
              <div className={styles.excelBox}>
                <div className={styles.excelTop}>
                  <div>
                    <h4 className={styles.excelTitle}>Bulk Excel Operations (.xlsx)</h4>
                    <p className={styles.excelDesc}>
                      Upload collection sheets (ASAYA, NAYI LEHER, ROOMANI, etc.) to import or update products. Form fields and Excel columns match 100%.
                    </p>
                  </div>
                  <div className={styles.excelActions}>
                    <input
                      key={excelFileInputKey}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className={styles.excelFileInput}
                      onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    />
                    <button
                      type="button"
                      className={`btn ${styles.submitBtn}`}
                      style={{ marginTop: 0 }}
                      onClick={handleImportExcel}
                      disabled={importingExcel || !excelFile}
                    >
                      <span>{importingExcel ? "Importing..." : "Upload & Import Excel"}</span>
                      <span className="btn-arrow">↑</span>
                    </button>
                    <button
                      type="button"
                      className={styles.ghostBtn}
                      onClick={handleExportExcel}
                    >
                      Export Catalog (.xlsx)
                    </button>
                  </div>
                </div>
                {excelStatus ? (
                  <p className={excelStatus.includes("failed") || excelStatus.includes("Error") ? styles.errorText : styles.successText}>
                    {excelStatus}
                  </p>
                ) : null}
              </div>

              <div className={styles.contentGrid}>
                {/* Product List Panel (Right side, order: 2) */}
                <section className={styles.bannerPanel}>
                  <div className={styles.sectionHead}>
                    <div>
                      <p className="eyebrow">Catalogue</p>
                      <h3 className={`display ${styles.sectionTitle}`}>
                        Products ({filteredProducts.length}{productList.length !== filteredProducts.length ? ` of ${productList.length}` : ""})
                      </h3>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <button type="button" className={`btn ${styles.refreshBtn}`} onClick={loadProducts}>
                        <span>{refreshingProducts ? "Refreshing..." : "Refresh"}</span>
                        <span className="btn-arrow">→</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className={styles.filterRow}>
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Search by name, SKU, collection..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                    {productSearch ? (
                      <button type="button" className={styles.ghostBtn} onClick={() => setProductSearch("")}>
                        Clear
                      </button>
                    ) : null}
                  </div>

                  {filteredProducts.length ? (
                    <div className={styles.productGrid}>
                      {filteredProducts.map((product) => (
                        <article key={product.id || product.slug} className={styles.productCard}>
                          <div className={styles.productMediaWrap}>
                            {product.images?.[0] ? (
                              <img className={styles.productMedia} src={product.images[0]} alt={product.name} />
                            ) : (
                              <div className={styles.bannerFallback}>No image</div>
                            )}
                            <div className={styles.bannerBadges}>
                              <span className={styles.badge}>{product.collection || "Collection"}</span>
                              <span className={styles.badge}>{product.active ? "Active" : "Draft"}</span>
                            </div>
                          </div>

                          <div className={styles.productBody}>
                            <div>
                              <p className={styles.bannerMeta}>{product.sku || product.styleCode || "NO SKU"}</p>
                              <h4 className={`display ${styles.bannerTitle}`}>{product.name}</h4>
                              <p className={styles.bannerSubtitle}>
                                {product.fabric ? `${product.fabric} • ` : ""}{product.subCategory || product.category}
                              </p>
                            </div>
                            <div className={styles.bannerFoot}>
                              <span>INR {Number(product.price || 0).toLocaleString("en-IN")}</span>
                              <span>Stock: {product.stock || "MTO"}</span>
                            </div>
                            <div className={styles.productActions}>
                              <button type="button" className={styles.ghostBtn} onClick={() => handleEditProduct(product)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className={styles.dangerBtn}
                                onClick={() => handleDeleteProduct(product)}
                                disabled={deletingProductId === (product.id || product.slug)}
                              >
                                {deletingProductId === (product.id || product.slug) ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.placeholderState}>
                      <p className="eyebrow">Catalogue</p>
                      <h4 className={`display ${styles.placeholderTitle}`}>No products found.</h4>
                      <p className={styles.placeholderCopy}>
                        {productSearch ? "Try adjusting your search query." : "Use the form on the left or upload an Excel sheet to add products."}
                      </p>
                    </div>
                  )}
                </section>

                {/* Product Form Panel (Left side, order: 1) */}
                <aside className={styles.formPanel}>
                  <div className={styles.sectionHeadCompact}>
                    <div>
                      <p className="eyebrow">Product Management</p>
                      <h3 className={`display ${styles.sectionTitle}`}>
                        {editingProductId ? "Edit Product" : "Upload Product"}
                      </h3>
                    </div>
                    {editingProductId ? (
                      <button type="button" className={styles.ghostBtn} onClick={clearProductForm}>
                        Cancel
                      </button>
                    ) : null}
                  </div>

                  <form className={styles.form} onSubmit={handleProductUpload}>
                    {/* Section 1: Basic Details */}
                    <div className={styles.formSectionGroup}>
                      <p className={styles.formSubheading}>Basic Information</p>
                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Product Name *</span>
                        <input
                          className={styles.fieldInput}
                          placeholder="e.g. Black Hand Embroidered Kurta"
                          value={productForm.name}
                          onChange={(e) => setProductForm((curr) => ({ ...curr, name: e.target.value }))}
                          required
                        />
                      </label>

                      <div className={styles.inlineFields}>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>SKU / Style Code</span>
                          <input
                            className={styles.fieldInput}
                            placeholder="e.g. HKP-234-BLACK"
                            value={productForm.sku}
                            onChange={(e) => setProductForm((curr) => ({ ...curr, sku: e.target.value }))}
                          />
                        </label>

                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Slug</span>
                          <input
                            className={styles.fieldInput}
                            placeholder="e.g. black-hand-embroidered-kurta"
                            value={productForm.slug}
                            onChange={(e) => setProductForm((curr) => ({ ...curr, slug: e.target.value }))}
                          />
                        </label>
                      </div>

                      <div className={styles.inlineFields3}>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Collection</span>
                          <input
                            className={styles.fieldInput}
                            placeholder="e.g. ASAYA"
                            value={productForm.collection}
                            onChange={(e) => setProductForm((curr) => ({ ...curr, collection: e.target.value }))}
                          />
                        </label>

                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Category</span>
                          <input
                            className={styles.fieldInput}
                            placeholder="Men's Wear / Women's Wear"
                            value={productForm.category}
                            onChange={(e) => setProductForm((curr) => ({ ...curr, category: e.target.value }))}
                          />
                        </label>

                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Sub Category</span>
                          <input
                            className={styles.fieldInput}
                            placeholder="Kurta / Co-ord Set"
                            value={productForm.subCategory}
                            onChange={(e) => setProductForm((curr) => ({ ...curr, subCategory: e.target.value }))}
                          />
                        </label>
                      </div>

                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Color</span>
                        <input
                          className={styles.fieldInput}
                          placeholder="e.g. Black, Olive Green, Natural Ivory"
                          value={productForm.color}
                          onChange={(e) => setProductForm((curr) => ({ ...curr, color: e.target.value }))}
                        />
                      </label>
                    </div>

                    {/* Section 2: Craft & Composition */}
                    <div className={styles.formSectionGroup}>
                      <p className={styles.formSubheading}>Craft & Specifications</p>
                      <div className={styles.inlineFields}>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Set Includes</span>
                          <input
                            className={styles.fieldInput}
                            placeholder="e.g. 1 Kurta"
                            value={productForm.setIncludes}
                            onChange={(e) => setProductForm((curr) => ({ ...curr, setIncludes: e.target.value }))}
                          />
                        </label>

                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Fabric</span>
                          <input
                            className={styles.fieldInput}
                            placeholder="e.g. Matka Silk, Raw Silk, Chanderi"
                            value={productForm.fabric}
                            onChange={(e) => setProductForm((curr) => ({ ...curr, fabric: e.target.value }))}
                          />
                        </label>
                      </div>

                      <div className={styles.inlineFields}>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Fit</span>
                          <input
                            className={styles.fieldInput}
                            placeholder="e.g. Regular, Slim, Relaxed"
                            value={productForm.fit}
                            onChange={(e) => setProductForm((curr) => ({ ...curr, fit: e.target.value }))}
                          />
                        </label>

                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Wash Care</span>
                          <input
                            className={styles.fieldInput}
                            placeholder="e.g. Dry Clean Only"
                            value={productForm.washCare}
                            onChange={(e) => setProductForm((curr) => ({ ...curr, washCare: e.target.value }))}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Section 3: Pricing & Inventory */}
                    <div className={styles.formSectionGroup}>
                      <p className={styles.formSubheading}>Pricing & Inventory</p>
                      <div className={styles.inlineFields}>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Price (INR) *</span>
                          <input
                            className={styles.fieldInput}
                            type="number"
                            min="0"
                            placeholder="26900"
                            value={productForm.price}
                            onChange={(e) => setProductForm((curr) => ({ ...curr, price: e.target.value }))}
                            required
                          />
                        </label>

                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>MRP (INR)</span>
                          <input
                            className={styles.fieldInput}
                            type="number"
                            min="0"
                            placeholder="26900"
                            value={productForm.mrp}
                            onChange={(e) => setProductForm((curr) => ({ ...curr, mrp: e.target.value }))}
                          />
                        </label>
                      </div>

                      <div className={styles.inlineFields}>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Stock</span>
                          <input
                            className={styles.fieldInput}
                            placeholder="MTO or number"
                            value={productForm.stock}
                            onChange={(e) => setProductForm((curr) => ({ ...curr, stock: e.target.value }))}
                          />
                        </label>

                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Sizes</span>
                          <input
                            className={styles.fieldInput}
                            placeholder="XS,S,M,L,XL,XXL"
                            value={productForm.sizes}
                            onChange={(e) => setProductForm((curr) => ({ ...curr, sizes: e.target.value }))}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Section 4: Highlights & Policies */}
                    <div className={styles.formSectionGroup}>
                      <p className={styles.formSubheading}>Highlights & Policies</p>
                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Product Highlights (Description)</span>
                        <textarea
                          className={styles.fieldTextarea}
                          rows={3}
                          placeholder="Artisanal description and styling notes..."
                          value={productForm.description}
                          onChange={(e) => setProductForm((curr) => ({ ...curr, description: e.target.value }))}
                        />
                      </label>

                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Shipping Details</span>
                        <textarea
                          className={styles.fieldTextarea}
                          rows={2}
                          placeholder="Free shipping across India on all orders. Made-To-Order Timeline: 2-3 Weeks."
                          value={productForm.shippingDetails}
                          onChange={(e) => setProductForm((curr) => ({ ...curr, shippingDetails: e.target.value }))}
                        />
                      </label>

                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Disclaimer</span>
                        <textarea
                          className={styles.fieldTextarea}
                          rows={2}
                          placeholder="Slight variations in colour, texture, embroidery..."
                          value={productForm.disclaimer}
                          onChange={(e) => setProductForm((curr) => ({ ...curr, disclaimer: e.target.value }))}
                        />
                      </label>
                    </div>

                    {/* Section 5: Media & Visibility */}
                    <div className={styles.formSectionGroup}>
                      <p className={styles.formSubheading}>Media & Visibility</p>
                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Image URLs (one per line or comma-separated)</span>
                        <textarea
                          className={styles.fieldTextarea}
                          rows={3}
                          placeholder="https://... or /images/..."
                          value={productForm.imageUrls}
                          onChange={(e) => setProductForm((curr) => ({ ...curr, imageUrls: e.target.value }))}
                        />
                      </label>

                      <label className={`${styles.fieldGroup} ${styles.uploadField}`}>
                        <span className={styles.fieldLabel}>{editingProductId ? "Replace Image Files (optional)" : "Upload Image Files"}</span>
                        <input
                          key={productFileInputKey}
                          className={styles.fileInput}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => setProductForm((curr) => ({ ...curr, images: Array.from(e.target.files || []).slice(0, 5) }))}
                        />
                        <span className={styles.uploadHint}>
                          {productForm.images.length
                            ? `${productForm.images.length}/5 image(s) selected`
                            : editingProductId
                            ? "Leave empty to retain current images."
                            : "Upload up to 5 image files."}
                        </span>
                      </label>

                      <div className={styles.inlineFields}>
                        <label className={`${styles.fieldGroup} ${styles.checkboxGroup}`}>
                          <span className={styles.fieldLabel}>Visibility</span>
                          <span className={styles.toggleWrap}>
                            <input
                              type="checkbox"
                              checked={productForm.active}
                              onChange={(e) => setProductForm((curr) => ({ ...curr, active: e.target.checked }))}
                            />
                            <span>{productForm.active ? "Active" : "Draft"}</span>
                          </span>
                        </label>

                        <label className={`${styles.fieldGroup} ${styles.checkboxGroup}`}>
                          <span className={styles.fieldLabel}>Featured</span>
                          <span className={styles.toggleWrap}>
                            <input
                              type="checkbox"
                              checked={productForm.featured}
                              onChange={(e) => setProductForm((curr) => ({ ...curr, featured: e.target.checked }))}
                            />
                            <span>{productForm.featured ? "Yes" : "No"}</span>
                          </span>
                        </label>
                      </div>
                    </div>

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
              </div>
            </div>
          ) : null}

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