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
  sku: "",
  styleCode: "",
  description: "",
  category: "Men's Wear",
  subCategory: "Kurta",
  collection: "ASAYA",
  fabric: "Matka Silk",
  sizes: "S,M,L,XL",
  sizeCharges: "{}",
  clothCare: "Dry Clean Only",
  termsAndConditions: "",
  price: "",
  mrp: "",
  stock: "MTO",
  featured: false,
  active: true,
  images: [],
};

const SIDEBAR_ITEMS = [
  { key: "products", label: "Products", meta: "Manage" },
  { key: "bulk-upload", label: "Excel Bulk Upload", meta: "Import" },
  { key: "collections", label: "Collections", meta: "Overview" },
  { key: "banners", label: "Banners", meta: "Upload" },
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

  // Product state & management
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [productFileInputKey, setProductFileInputKey] = useState(0);
  const [productStatus, setProductStatus] = useState("");
  const [productList, setProductList] = useState([]);
  const [refreshingProducts, setRefreshingProducts] = useState(false);
  const [productCollectionFilter, setProductCollectionFilter] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState("");
  const [productSort, setProductSort] = useState("newest");
  const [productSearch, setProductSearch] = useState("");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [modalExistingImages, setModalExistingImages] = useState([]);
  const [modalNewImageUrls, setModalNewImageUrls] = useState("");
  const [modalFiles, setModalFiles] = useState([]);
  const [savingProduct, setSavingProduct] = useState(false);

  // Excel Bulk Upload State
  const [excelFile, setExcelFile] = useState(null);
  const [excelPreview, setExcelPreview] = useState(null);
  const [excelLoading, setExcelLoading] = useState(false);
  const [excelStatus, setExcelStatus] = useState("");
  const [excelMode, setExcelMode] = useState("upsert");
  const [excelDefaultCollection, setExcelDefaultCollection] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Orders & Users
  const [orderList, setOrderList] = useState([]);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [orderFilterStatus, setOrderFilterStatus] = useState("");
  const [orderFilterPayment, setOrderFilterPayment] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusMessage, setOrderStatusMessage] = useState("");
  const [userList, setUserList] = useState([]);
  const [refreshingUsers, setRefreshingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const [activeSection, setActiveSection] = useState("products");
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [deletingBannerId, setDeletingBannerId] = useState(null);

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

  const collectionsSummary = useMemo(() => {
    const counts = {};
    for (const p of productList) {
      const col = String(p.collection || "GENERAL").trim().toUpperCase();
      counts[col] = (counts[col] || 0) + 1;
    }
    return Object.entries(counts).map(([name, count]) => {
      const sample = productList.find(
        (p) => String(p.collection || "").trim().toUpperCase() === name
      );
      return {
        name,
        count,
        sampleImage: sample?.images?.[0] || null,
        sampleName: sample?.name || null,
      };
    });
  }, [productList]);

  const filteredProducts = useMemo(() => {
    let list = [...productList];
    if (productCollectionFilter) {
      const target = productCollectionFilter.trim().toUpperCase();
      list = list.filter((p) => String(p.collection || "").trim().toUpperCase() === target);
    }
    if (productCategoryFilter) {
      list = list.filter((p) => String(p.category || "").toLowerCase().includes(productCategoryFilter.toLowerCase()));
    }
    if (productStatusFilter === "active") {
      list = list.filter((p) => p.active !== false);
    } else if (productStatusFilter === "draft") {
      list = list.filter((p) => p.active === false);
    }
    if (productSearch.trim()) {
      const q = productSearch.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.styleCode && p.styleCode.toLowerCase().includes(q)) ||
          (p.fabric && p.fabric.toLowerCase().includes(q)) ||
          (p.subCategory && p.subCategory.toLowerCase().includes(q))
      );
    }

    if (productSort === "price-asc") {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (productSort === "price-desc") {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (productSort === "name-asc") {
      list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    }
    return list;
  }, [productList, productCollectionFilter, productCategoryFilter, productStatusFilter, productSearch, productSort]);


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
    const collectionsCount = collectionsSummary.length;
    return { total: productList.length, active, featured, withImages, collectionsCount };
  }, [productList, collectionsSummary]);

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
      const data = await response.json();
      setOrderList(data.orders || []);
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
      const response = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      setUserList(data.users || []);
    } catch {
      setUserList([]);
    } finally {
      setRefreshingUsers(false);
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

  // ── Excel Bulk Upload Handlers ─────────────────────────────────────────────
  async function handleExcelPreview() {
    if (!excelFile) return;
    setExcelLoading(true);
    setExcelStatus("");
    try {
      const formData = new FormData();
      formData.append("file", excelFile);
      formData.append("preview", "true");
      if (excelDefaultCollection) formData.append("defaultCollection", excelDefaultCollection);

      const res = await fetch("/api/admin/upload-sheet", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to preview Excel sheet");
      }
      setExcelPreview(data);
      setExcelStatus(`✓ Sheet analyzed: Found ${data.totalRows} products across collections: ${data.detectedCollections?.join(", ")}`);
    } catch (err) {
      setExcelStatus("Error: " + err.message);
    } finally {
      setExcelLoading(false);
    }
  }

  async function handleExcelImport() {
    if (!excelFile) return;
    setExcelLoading(true);
    setExcelStatus("");
    try {
      const formData = new FormData();
      formData.append("file", excelFile);
      formData.append("preview", "false");
      formData.append("mode", excelMode);
      if (excelDefaultCollection) formData.append("defaultCollection", excelDefaultCollection);

      const res = await fetch("/api/admin/upload-sheet", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to import products");
      }

      setExcelStatus(`✓ Success! Added ${data.addedCount} new pieces, updated ${data.updatedCount} pieces. Active collections: ${data.allCollections?.join(", ")}`);
      setExcelPreview(null);
      setExcelFile(null);
      await loadProducts();
    } catch (err) {
      setExcelStatus("Error: " + err.message);
    } finally {
      setExcelLoading(false);
    }
  }

  // ── Product Modal, CRUD & Batch Handlers ───────────────────────────────
  function openCreateProductModal() {
    setEditingProductId(null);
    setProductForm({
      ...EMPTY_PRODUCT_FORM,
      collection: productCollectionFilter || (collectionsSummary[0]?.name || "ASAYA"),
    });
    setModalExistingImages([]);
    setModalNewImageUrls("");
    setModalFiles([]);
    setIsProductModalOpen(true);
  }

  function openEditProductModal(product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || "",
      slug: product.slug || "",
      sku: product.sku || product.styleCode || "",
      styleCode: product.styleCode || product.sku || "",
      description: product.description || "",
      category: product.category || "Men's Wear",
      subCategory: product.subCategory || "Kurta",
      collection: product.collection || "ASAYA",
      fabric: product.fabric || "Matka Silk",
      sizes: Array.isArray(product.sizes) ? product.sizes.join(",") : (product.sizes || "S,M,L,XL"),
      sizeCharges: JSON.stringify(product.sizeCharges || {}),
      clothCare: product.clothCare || "Dry Clean Only",
      termsAndConditions: product.termsAndConditions || "",
      price: String(product.price ?? ""),
      mrp: product.mrp != null ? String(product.mrp) : "",
      stock: String(product.stock ?? "MTO"),
      featured: Boolean(product.featured),
      active: product.active !== false,
      images: [],
    });
    setModalExistingImages(Array.isArray(product.images) ? [...product.images] : []);
    setModalNewImageUrls("");
    setModalFiles([]);
    setIsProductModalOpen(true);
  }

  function closeProductModal() {
    setIsProductModalOpen(false);
    setEditingProductId(null);
    setProductForm(EMPTY_PRODUCT_FORM);
    setModalExistingImages([]);
    setModalNewImageUrls("");
    setModalFiles([]);
  }

  function removeModalImage(indexToRemove) {
    setModalExistingImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  async function handleProductSave(event) {
    event?.preventDefault?.();
    setSavingProduct(true);
    setProductStatus("");

    try {
      const extraUrls = modalNewImageUrls
        .split(/[\n,]+/)
        .map((u) => u.trim())
        .filter(Boolean);

      const allUrls = [...modalExistingImages, ...extraUrls];
      const isEditing = Boolean(editingProductId);

      let res;
      if (modalFiles.length > 0) {
        const formData = new FormData();
        formData.append("name", productForm.name);
        formData.append("slug", productForm.slug || "");
        formData.append("sku", productForm.sku || "");
        formData.append("styleCode", productForm.styleCode || productForm.sku || "");
        formData.append("description", productForm.description);
        formData.append("category", productForm.category);
        formData.append("subCategory", productForm.subCategory);
        formData.append("collection", productForm.collection);
        formData.append("fabric", productForm.fabric);
        formData.append("sizes", productForm.sizes);
        formData.append("price", productForm.price);
        formData.append("mrp", productForm.mrp || productForm.price);
        formData.append("stock", productForm.stock);
        formData.append("clothCare", productForm.clothCare);
        formData.append("featured", productForm.featured ? "true" : "false");
        formData.append("active", productForm.active ? "true" : "false");

        for (const url of allUrls) {
          formData.append("images", url);
        }
        for (const file of modalFiles) {
          formData.append("images", file);
        }

        res = await fetch(isEditing ? `/api/products/${editingProductId}` : "/api/products", {
          method: isEditing ? "PATCH" : "POST",
          body: formData,
        });
      } else {
        const payload = {
          name: productForm.name,
          slug: productForm.slug || "",
          sku: productForm.sku || "",
          styleCode: productForm.styleCode || productForm.sku || "",
          description: productForm.description,
          category: productForm.category,
          subCategory: productForm.subCategory,
          collection: productForm.collection,
          fabric: productForm.fabric,
          sizes: typeof productForm.sizes === "string"
            ? productForm.sizes.split(",").map((s) => s.trim()).filter(Boolean)
            : productForm.sizes,
          price: Number(productForm.price || 0),
          mrp: productForm.mrp ? Number(productForm.mrp) : undefined,
          stock: productForm.stock,
          clothCare: productForm.clothCare,
          featured: Boolean(productForm.featured),
          active: productForm.active !== false,
          images: allUrls,
        };

        res = await fetch(isEditing ? `/api/products/${editingProductId}` : "/api/products", {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save product");
      }

      setProductStatus(isEditing ? `✓ Updated "${productForm.name}" successfully.` : `✓ Created "${productForm.name}" successfully.`);
      closeProductModal();
      await loadProducts();
    } catch (err) {
      setProductStatus("Error: " + err.message);
    } finally {
      setSavingProduct(false);
    }
  }

  async function toggleProductActive(product) {
    const newActive = product.active === false;
    setProductList((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, active: newActive } : p))
    );

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive }),
      });
      if (!res.ok) {
        await loadProducts();
      }
    } catch {
      await loadProducts();
    }
  }

  async function confirmDeleteProduct() {
    if (!productToDelete) return;
    const p = productToDelete;
    setDeletingProductId(p.id);

    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Delete failed");
      }
      setProductStatus(`✓ Product "${p.name}" deleted.`);
      setProductToDelete(null);
      await loadProducts();
    } catch (err) {
      setProductStatus("Error: " + err.message);
    } finally {
      setDeletingProductId(null);
    }
  }

  async function handleBatchDelete() {
    if (!selectedProductIds.size) return;
    const ids = Array.from(selectedProductIds);
    if (!window.confirm(`Permanently delete ${ids.length} selected product(s)?`)) return;

    setProductStatus(`Deleting ${ids.length} products...`);
    for (const id of ids) {
      await fetch(`/api/products/${id}`, { method: "DELETE" }).catch(() => {});
    }
    setSelectedProductIds(new Set());
    await loadProducts();
    setProductStatus(`✓ Deleted ${ids.length} products.`);
  }

  async function handleBatchSetActive(active) {
    if (!selectedProductIds.size) return;
    const ids = Array.from(selectedProductIds);
    for (const id of ids) {
      await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      }).catch(() => {});
    }
    setSelectedProductIds(new Set());
    await loadProducts();
    setProductStatus(`✓ Updated ${ids.length} products to ${active ? "Active" : "Draft"}.`);
  }

  const allFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedProductIds.has(p.id));

  function handleToggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map((p) => p.id)));
    }
  }

  function handleToggleSelectOne(id) {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }


  // ── Banner Handlers ────────────────────────────────────────────────────────
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
    const shouldDelete = window.confirm(`Delete banner "${banner.title}"? This cannot be undone.`);
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

  // ── Render: Unauthenticated Login Screen ──────────────────────────────────
  if (!user) {
    return (
      <main className={styles.loginShell}>
        <div className={styles.loginBackdrop} />

        <section className={styles.loginPanel}>
          <div className={styles.loginIntro}>
            <div>
              <p className="eyebrow">Administration</p>
              <h1 className={`display ${styles.loginTitle}`}>Heer Ranjha Portal</h1>
              <p className={styles.loginCopy}>
                Manage products, upload Excel catalogue sheets, configure collections, and monitor store orders in one unified dashboard.
              </p>
            </div>

            <div className={styles.loginHighlights}>
              <div className={styles.highlightCard}>
                <span className={styles.highlightValue}>01</span>
                <span className={styles.highlightLabel}>Excel Upload</span>
              </div>
              <div className={styles.highlightCard}>
                <span className={styles.highlightValue}>02</span>
                <span className={styles.highlightLabel}>Collections</span>
              </div>
              <div className={styles.highlightCard}>
                <span className={styles.highlightValue}>03</span>
                <span className={styles.highlightLabel}>Product Editor</span>
              </div>
            </div>
          </div>

          <form className={styles.loginForm} onSubmit={handleLogin}>
            <p className="eyebrow">Sign In</p>
            <h2 className={`display ${styles.loginFormTitle}`}>Admin Access</h2>
            <p className={styles.loginFormCopy}>Enter your admin credentials to access the console.</p>

            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Email</span>
              <input
                className={styles.fieldInput}
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                type="email"
                placeholder="admin@heerranjha.com"
                required
              />
            </label>

            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Password</span>
              <input
                className={styles.fieldInput}
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                type="password"
                placeholder="••••••••"
                required
              />
            </label>

            {loginError ? <p className={styles.errorText}>{loginError}</p> : null}
            {loginSuccess ? <p className={styles.successText}>{loginSuccess}</p> : null}

            <button className={`btn btn-dark ${styles.loginSubmitBtn}`} type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
              <span style={{ color: "var(--charcoal, #1A1512)" }}>{loading ? "Signing In..." : "Log In to Console"}</span>
              <span className="btn-arrow" style={{ color: "var(--charcoal, #1A1512)" }}>→</span>
            </button>

            <div className={styles.demoLoginNote}>
              <p><strong>Admin Sign-In Credentials:</strong></p>
              <p>Email: <code>admin@heerranjha.com</code></p>
              <p>Password: <code>admin123</code></p>
              <button
                type="button"
                className={styles.demoLoginBtn}
                onClick={() => {
                  setLoginEmail("admin@heerranjha.com");
                  setLoginPassword("admin123");
                }}
              >
                ⚡ Fill Credentials
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  // ── Render: Authenticated Admin Dashboard ──────────────────────────────────
  return (
    <main className={styles.dashboardPage}>
      <div className={styles.dashboardShell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <p className="eyebrow">Heer Ranjha</p>
            <h1 className={`display ${styles.sidebarTitle}`}>Admin Console</h1>
            <p className={styles.sidebarCopy}>Manage products, collections, and Excel catalogue imports.</p>
          </div>

          <nav className={styles.sidebarNav} aria-label="Admin sections">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = activeSection === item.key;
              const badge =
                item.key === "products"
                  ? productList.length
                  : item.key === "collections"
                  ? collectionsSummary.length
                  : item.key === "banners"
                  ? bannerList.length
                  : item.key === "orders"
                  ? orderList.length
                  : item.key === "users"
                  ? userList.length
                  : null;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ""}`}
                  onClick={() => setActiveSection(item.key)}
                >
                  <div className={styles.sidebarItemContent}>
                    <span className={styles.sidebarItemMeta}>{item.meta}</span>
                    <span className={`display ${styles.sidebarItemLabel}`}>{item.label}</span>
                  </div>
                  {badge !== null ? (
                    <span className={styles.sidebarBadge}>{badge}</span>
                  ) : null}
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
                {activeSection === "bulk-upload"
                  ? "Excel Bulk Upload"
                  : activeSection === "collections"
                    ? "Collections Overview"
                    : activeSection === "products"
                      ? "Product Catalogue"
                      : activeSection === "banners"
                        ? "Homepage Banners"
                        : activeSection === "orders"
                          ? "Order History"
                          : activeSection === "payments"
                            ? "Payment Transactions"
                            : "User Registry"}
              </h2>
              <p className={styles.heroCopy}>
                {activeSection === "bulk-upload"
                  ? "Import multi-collection catalogue sheets (.xlsx, .xls, .csv) with automatic image mapping."
                  : activeSection === "collections"
                    ? "View active collections, piece counts, and link directly to the storefront."
                    : activeSection === "products"
                      ? "Search, filter by collection, edit piece details, or add single items."
                      : activeSection === "banners"
                        ? "Manage homepage hero video and image slides."
                        : activeSection === "orders"
                          ? "Track orders, fulfillment status, and customer shipping details."
                          : activeSection === "payments"
                            ? "Track transaction flows and Razorpay payments."
                            : "View registered users and account information."}
              </p>
            </div>

            <div className={styles.statsGrid}>
              {activeSection === "bulk-upload" || activeSection === "collections" || activeSection === "products" ? (
                <>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{productStats.total}</span>
                    <span className={styles.statLabel}>Total Pieces</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{productStats.collectionsCount}</span>
                    <span className={styles.statLabel}>Collections</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{productStats.active}</span>
                    <span className={styles.statLabel}>Active</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{productStats.featured}</span>
                    <span className={styles.statLabel}>Featured</span>
                  </div>
                </>
              ) : activeSection === "banners" ? (
                <>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{bannerStats.total}</span>
                    <span className={styles.statLabel}>Total Banners</span>
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
                    <span className={styles.statValue}>₹{Math.round(orderStats.revenue).toLocaleString("en-IN")}</span>
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
                    <span className={styles.statValue}>₹{Math.round(paymentStats.amount).toLocaleString("en-IN")}</span>
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
                    <span className={styles.statValue}>₹{Math.round(userStats.totalSpend).toLocaleString("en-IN")}</span>
                    <span className={styles.statLabel}>Spend</span>
                  </div>
                </>
              )}
            </div>
          </header>

          {/* ── SECTION: EXCEL BULK UPLOAD ─────────────────────────────────── */}
          {activeSection === "bulk-upload" ? (
            <div className={styles.contentGrid}>
              <section className={styles.bannerPanel} style={{ gridColumn: "1 / -1" }}>
                <div className={styles.sectionHead}>
                  <div>
                    <p className="eyebrow">Catalogue Import</p>
                    <h3 className={`display ${styles.sectionTitle}`}>Excel Sheet Bulk Upload</h3>
                    <p className={styles.sidebarCopy}>
                      Upload product spreadsheets (.xlsx, .xls, .csv). Follows the reference structure with columns:
                      SKU, Product Name, Category, Sub Category, Set Includes, Collection, Fabric, Wash Care, Highlights, Price, MRP, Image URLs.
                    </p>
                  </div>
                  <a
                    href="/api/admin/template"
                    className={styles.templateBtn}
                    download="heer-ranjha-products-template.xlsx"
                  >
                    <span>📥 Download Sample Excel Template</span>
                  </a>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginTop: "1rem" }}>
                  {/* Drop zone */}
                  <div
                    className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.[0]) {
                        setExcelFile(e.dataTransfer.files[0]);
                        setExcelPreview(null);
                        setExcelStatus("");
                      }
                    }}
                    onClick={() => document.getElementById("excel-file-input")?.click()}
                  >
                    <input
                      id="excel-file-input"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setExcelFile(e.target.files[0]);
                          setExcelPreview(null);
                          setExcelStatus("");
                        }
                      }}
                    />
                    <span className={styles.dropZoneIcon}>📑</span>
                    <h4 className="display" style={{ fontSize: "1.2rem", margin: 0, color: "var(--ivory)" }}>
                      {excelFile ? excelFile.name : "Choose or drag & drop Excel Sheet"}
                    </h4>
                    <p className={styles.uploadHint}>
                      {excelFile
                        ? `Selected file: ${excelFile.name} (${(excelFile.size / 1024).toFixed(1)} KB)`
                        : "Click here or drop your .xlsx catalogue file. Supports Google Drive image links and multiple collections."}
                    </p>
                    <button type="button" className="btn btn-dark" style={{ pointerEvents: "none", marginTop: "0.25rem" }}>
                      <span>Browse File</span>
                    </button>
                  </div>

                  {/* Settings card */}
                  <div className={styles.formPanel} style={{ padding: "1.25rem" }}>
                    <h4 className="display" style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--ivory)" }}>
                      Import Configuration
                    </h4>

                    <label className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>Import Mode</span>
                      <select
                        className={styles.fieldInput}
                        value={excelMode}
                        onChange={(e) => setExcelMode(e.target.value)}
                      >
                        <option value="upsert">Merge & Update (Update matching SKUs, add new pieces)</option>
                        <option value="append">Append All (Always add rows as new pieces)</option>
                        <option value="replace-collection">Replace Collection (Overwrites matching collection names)</option>
                      </select>
                    </label>

                    <label className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>Default Collection (if column is blank)</span>
                      <input
                        className={styles.fieldInput}
                        placeholder="e.g. VIRASAT"
                        value={excelDefaultCollection}
                        onChange={(e) => setExcelDefaultCollection(e.target.value)}
                      />
                    </label>

                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                      <button
                        type="button"
                        className="btn btn-dark"
                        disabled={!excelFile || excelLoading}
                        onClick={handleExcelPreview}
                        style={{ flex: 1, justifyContent: "center" }}
                      >
                        <span>{excelLoading ? "Analyzing..." : "1. Preview Sheet"}</span>
                      </button>
                      <button
                        type="button"
                        className="btn"
                        disabled={!excelFile || excelLoading}
                        onClick={handleExcelImport}
                        style={{ flex: 1, justifyContent: "center" }}
                      >
                        <span>{excelLoading ? "Importing..." : "2. Import Now"}</span>
                        <span className="btn-arrow">→</span>
                      </button>
                    </div>

                    {excelStatus && (
                      <p
                        className={excelStatus.startsWith("Error") ? styles.errorText : styles.successText}
                        style={{ marginTop: "0.75rem", wordBreak: "break-word" }}
                      >
                        {excelStatus}
                      </p>
                    )}
                  </div>
                </div>

                {/* Preview Table */}
                {excelPreview && (
                  <div style={{ marginTop: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <h4 className="display" style={{ fontSize: "1.2rem", margin: 0, color: "var(--ivory)" }}>
                          Sheet Preview ({excelPreview.totalRows} products ready)
                        </h4>
                        <p className={styles.sidebarCopy} style={{ margin: "0.25rem 0 0" }}>
                          Detected Collections:{" "}
                          {excelPreview.detectedCollections?.map((c) => (
                            <span key={c} className={styles.tagBadge} style={{ marginRight: "0.4rem" }}>
                              {c}
                            </span>
                          ))}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-dark"
                        disabled={excelLoading}
                        onClick={handleExcelImport}
                      >
                        <span>Confirm & Import {excelPreview.totalRows} Products</span>
                        <span className="btn-arrow">→</span>
                      </button>
                    </div>

                    <div className={styles.previewTableWrap}>
                      <table className={styles.previewTable}>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Collection</th>
                            <th>Category</th>
                            <th>Sub Category</th>
                            <th>Fabric</th>
                            <th>Price</th>
                            <th>Images</th>
                          </tr>
                        </thead>
                        <tbody>
                          {excelPreview.sampleProducts?.map((item, idx) => (
                            <tr key={item.sku || idx}>
                              <td>{idx + 1}</td>
                              <td><code style={{ color: "#dec28a" }}>{item.sku}</code></td>
                              <td>{item.name}</td>
                              <td><span className={styles.tagBadge}>{item.collection}</span></td>
                              <td>{item.category}</td>
                              <td>{item.subCategory}</td>
                              <td>{item.fabric}</td>
                              <td>₹{Number(item.price || 0).toLocaleString("en-IN")}</td>
                              <td>{item.images?.length || 0} image(s)</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            </div>
          ) : null}

          {/* ── SECTION: COLLECTIONS OVERVIEW ──────────────────────────────── */}
          {activeSection === "collections" ? (
            <div className={styles.contentGrid}>
              <section className={styles.bannerPanel} style={{ gridColumn: "1 / -1" }}>
                <div className={styles.sectionHead}>
                  <div>
                    <p className="eyebrow">Collections</p>
                    <h3 className={`display ${styles.sectionTitle}`}>Active Collections ({collectionsSummary.length})</h3>
                    <p className={styles.sidebarCopy}>
                      All collections live on your storefront. You can upload 3 more collections using the Excel Bulk Uploader.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setActiveSection("bulk-upload")}
                  >
                    <span>+ Upload Collection via Excel</span>
                    <span className="btn-arrow">→</span>
                  </button>
                </div>

                <div className={styles.collectionsGrid}>
                  {collectionsSummary.map((col) => (
                    <article key={col.name} className={styles.collectionCard}>
                      {col.sampleImage ? (
                        <img src={col.sampleImage} alt={col.name} className={styles.collectionCardMedia} />
                      ) : (
                        <div className={styles.bannerFallback} style={{ height: "180px" }}>No Cover Image</div>
                      )}
                      <div className={styles.collectionCardBody}>
                        <h4 className={styles.collectionCardTitle}>{col.name}</h4>
                        <p className={styles.collectionCardPieces}>{col.count} piece{col.count !== 1 ? "s" : ""} in catalogue</p>
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <a
                            href={`/shop?collection=${encodeURIComponent(col.name)}#shop-layout`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.templateBtn}
                          >
                            View in Shop ↗
                          </a>
                          <button
                            type="button"
                            className={styles.ghostBtn}
                            onClick={() => {
                              setProductCollectionFilter(col.name);
                              setActiveSection("products");
                            }}
                          >
                            Filter Products
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {/* ── SECTION: PRODUCTS CATALOGUE ────────────────────────────────── */}
          {activeSection === "products" ? (
            <div className={styles.contentGridSingle}>
              <section className={styles.tablePanel}>
                {/* Header with primary actions */}
                <div className={styles.sectionHead}>
                  <div>
                    <p className="eyebrow">Inventory Management</p>
                    <h3 className={`display ${styles.sectionTitle}`}>
                      Product Catalogue ({filteredProducts.length}{filteredProducts.length !== productList.length ? ` of ${productList.length}` : ""})
                    </h3>
                    <p className={styles.sidebarCopy}>
                      Create, edit, toggle active status, and delete pieces in your store.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      type="button"
                      className="btn btn-dark"
                      onClick={openCreateProductModal}
                      style={{ padding: "0.65rem 1.35rem" }}
                    >
                      <span>+ Add New Product</span>
                      <span className="btn-arrow">→</span>
                    </button>
                    <button
                      type="button"
                      className={styles.templateBtn}
                      onClick={() => setActiveSection("bulk-upload")}
                    >
                      📊 Excel Bulk Upload
                    </button>
                    <div className={styles.viewToggleWrap}>
                      <button
                        type="button"
                        className={`${styles.viewToggleBtn} ${viewMode === "table" ? styles.viewToggleBtnActive : ""}`}
                        onClick={() => setViewMode("table")}
                        title="Table View"
                      >
                        ☰ List
                      </button>
                      <button
                        type="button"
                        className={`${styles.viewToggleBtn} ${viewMode === "grid" ? styles.viewToggleBtnActive : ""}`}
                        onClick={() => setViewMode("grid")}
                        title="Grid View"
                      >
                        ⊞ Grid
                      </button>
                    </div>
                    <button type="button" className={`btn ${styles.refreshBtn}`} onClick={loadProducts}>
                      <span>{refreshingProducts ? "Refreshing..." : "Refresh"}</span>
                    </button>
                  </div>
                </div>

                {productStatus && (
                  <div style={{ margin: "0.75rem 0" }}>
                    <p className={productStatus.startsWith("Error") ? styles.errorText : styles.successText}>
                      {productStatus}
                    </p>
                  </div>
                )}

                {/* Controls Bar: Filter Chips, Search, Filters */}
                <div className={styles.controlsBar}>
                  {/* Collection Chips */}
                  <div className={styles.filterChips}>
                    <button
                      type="button"
                      className={`${styles.chip} ${productCollectionFilter === "" ? styles.chipActive : ""}`}
                      onClick={() => setProductCollectionFilter("")}
                    >
                      <span>All Collections</span>
                      <span className={styles.chipBadge}>({productList.length})</span>
                    </button>
                    {collectionsSummary.map((col) => (
                      <button
                        key={col.name}
                        type="button"
                        className={`${styles.chip} ${productCollectionFilter === col.name ? styles.chipActive : ""}`}
                        onClick={() => setProductCollectionFilter(productCollectionFilter === col.name ? "" : col.name)}
                      >
                        <span>{col.name}</span>
                        <span className={styles.chipBadge}>({col.count})</span>
                      </button>
                    ))}
                  </div>

                  {/* Search, Category, Status, Sort */}
                  <div className={styles.controlsTopRow}>
                    <div style={{ display: "flex", gap: "0.6rem", flex: 1, minWidth: "260px", flexWrap: "wrap" }}>
                      <input
                        className={styles.fieldInput}
                        style={{ flex: 1, minWidth: "220px", padding: "0.65rem 1rem" }}
                        placeholder="Search by name, SKU, fabric, subcategory..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                      {productSearch && (
                        <button
                          type="button"
                          className={styles.ghostBtn}
                          onClick={() => setProductSearch("")}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                      <select
                        className={styles.fieldInput}
                        style={{ width: "auto", padding: "0.6rem 0.85rem" }}
                        value={productCategoryFilter}
                        onChange={(e) => setProductCategoryFilter(e.target.value)}
                      >
                        <option value="">All Categories</option>
                        <option value="Men's Wear">Men's Wear</option>
                        <option value="Women's Wear">Women's Wear</option>
                      </select>

                      <select
                        className={styles.fieldInput}
                        style={{ width: "auto", padding: "0.6rem 0.85rem" }}
                        value={productStatusFilter}
                        onChange={(e) => setProductStatusFilter(e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="draft">Draft Only</option>
                      </select>

                      <select
                        className={styles.fieldInput}
                        style={{ width: "auto", padding: "0.6rem 0.85rem" }}
                        value={productSort}
                        onChange={(e) => setProductSort(e.target.value)}
                      >
                        <option value="newest">Newest First</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="name-asc">Name: A to Z</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Batch Action Bar */}
                {selectedProductIds.size > 0 && (
                  <div className={styles.batchBar}>
                    <span className={styles.batchInfo}>
                      ✓ {selectedProductIds.size} piece{selectedProductIds.size !== 1 ? "s" : ""} selected
                    </span>
                    <div className={styles.batchActions}>
                      <button
                        type="button"
                        className={styles.ghostBtn}
                        style={{ background: "#ffffff", borderColor: "#ffffff", color: "#1A1512" }}
                        onClick={() => handleBatchSetActive(true)}
                      >
                        Set Active
                      </button>
                      <button
                        type="button"
                        className={styles.ghostBtn}
                        style={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.3)" }}
                        onClick={() => handleBatchSetActive(false)}
                      >
                        Set Draft
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        style={{ background: "#b71c1c", color: "#ffffff", borderColor: "#b71c1c" }}
                        onClick={handleBatchDelete}
                      >
                        Delete Selected ({selectedProductIds.size})
                      </button>
                      <button
                        type="button"
                        className={styles.ghostBtn}
                        style={{ color: "#ffffff", borderColor: "transparent", textDecoration: "underline" }}
                        onClick={() => setSelectedProductIds(new Set())}
                      >
                        Deselect
                      </button>
                    </div>
                  </div>
                )}

                {/* Content: Table View vs Grid View */}
                {filteredProducts.length > 0 ? (
                  viewMode === "table" ? (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th style={{ width: "40px", textAlign: "center" }}>
                              <input
                                type="checkbox"
                                checked={allFilteredSelected}
                                onChange={handleToggleSelectAll}
                                title="Select All"
                              />
                            </th>
                            <th style={{ width: "60px" }}>Media</th>
                            <th>Product Name & Code</th>
                            <th>Collection</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((product) => {
                            const isSelected = selectedProductIds.has(product.id);
                            return (
                              <tr key={product.id || product.slug} style={{ background: isSelected ? "rgba(201, 169, 110, 0.08)" : undefined }}>
                                <td style={{ textAlign: "center" }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectOne(product.id)}
                                  />
                                </td>
                                <td>
                                  {product.images?.[0] ? (
                                    <img
                                      src={product.images[0]}
                                      alt={product.name}
                                      className={styles.productThumb}
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className={styles.productThumbFallback}>No image</div>
                                  )}
                                </td>
                                <td>
                                  <div className={styles.productNameCell}>
                                    <span className={styles.productTableTitle}>{product.name}</span>
                                    <span className={styles.productTableSub}>
                                      <code>{product.sku || product.styleCode || product.slug}</code>
                                      {product.fabric ? ` • ${product.fabric}` : ""}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span className={styles.tagBadge}>{product.collection || "GENERAL"}</span>
                                </td>
                                <td>
                                  <div className={styles.productNameCell}>
                                    <span>{product.category || "-"}</span>
                                    <span className={styles.productTableSub}>{product.subCategory || "-"}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className={styles.productNameCell}>
                                    <span style={{ fontWeight: 600 }}>₹{Number(product.price || 0).toLocaleString("en-IN")}</span>
                                    {product.mrp && Number(product.mrp) > Number(product.price) && (
                                      <span style={{ fontSize: "0.72rem", textDecoration: "line-through", color: "rgba(26,21,18,0.4)" }}>
                                        MRP ₹{Number(product.mrp).toLocaleString("en-IN")}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <span style={{ fontSize: "0.78rem", color: "rgba(26,21,18,0.7)" }}>
                                    {product.stock || "MTO"}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className={`${styles.statusToggleBtn} ${product.active !== false ? styles.statusActive : styles.statusDraft}`}
                                    onClick={() => toggleProductActive(product)}
                                    title="Click to toggle Active / Draft"
                                  >
                                    <span>{product.active !== false ? "● Active" : "○ Draft"}</span>
                                  </button>
                                </td>
                                <td>
                                  <div className={styles.actionRow} style={{ justifyContent: "flex-end" }}>
                                    <button
                                      type="button"
                                      className={styles.iconBtn}
                                      onClick={() => openEditProductModal(product)}
                                      title="Edit Product"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      type="button"
                                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                      onClick={() => setProductToDelete(product)}
                                      title="Delete Product"
                                    >
                                      🗑️
                                    </button>
                                    <a
                                      href={`/product/${product.slug || product.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={styles.iconBtn}
                                      title="View in Store"
                                    >
                                      ↗
                                    </a>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={styles.productGrid}>
                      {filteredProducts.map((product) => (
                        <article key={product.id || product.slug} className={styles.productCard}>
                          <div className={styles.productMediaWrap}>
                            {product.images?.[0] ? (
                              <img className={styles.productMedia} src={product.images[0]} alt={product.name} loading="lazy" />
                            ) : (
                              <div className={styles.bannerFallback}>No image</div>
                            )}
                            <button
                              type="button"
                              className={`${styles.statusToggleBtn} ${product.active !== false ? styles.statusActive : styles.statusDraft}`}
                              style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(255,255,255,0.9)" }}
                              onClick={() => toggleProductActive(product)}
                            >
                              <span>{product.active !== false ? "Active" : "Draft"}</span>
                            </button>
                          </div>

                          <div className={styles.productBody}>
                            <div>
                              <h4 className={`display ${styles.bannerTitle}`}>{product.name}</h4>
                              <p className={styles.bannerMeta}>{product.sku || product.styleCode || product.slug}</p>
                              <p className={styles.bannerSubtitle}>
                                <span className={styles.tagBadge}>{product.collection}</span> • {product.subCategory}
                              </p>
                            </div>
                            <div className={styles.bannerFoot}>
                              <span>₹{Number(product.price || 0).toLocaleString("en-IN")}</span>
                              <span>{product.stock || "MTO"}</span>
                            </div>
                            <div className={styles.productActions}>
                              <button type="button" className={styles.ghostBtn} onClick={() => openEditProductModal(product)}>
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                className={styles.dangerBtn}
                                onClick={() => setProductToDelete(product)}
                              >
                                🗑️ Delete
                              </button>
                              <a
                                href={`/product/${product.slug || product.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.ghostBtn}
                                style={{ padding: "0.5rem 0.75rem" }}
                                title="View in Store"
                              >
                                ↗
                              </a>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )
                ) : (
                  <div className={styles.placeholderState}>
                    <p className="eyebrow">No Pieces Found</p>
                    <h4 className={`display ${styles.placeholderTitle}`}>No products match current filters.</h4>
                    <p className={styles.placeholderCopy}>Try resetting your search or collection filter, or add a new piece.</p>
                    <button
                      type="button"
                      className="btn btn-dark"
                      style={{ marginTop: "1rem" }}
                      onClick={openCreateProductModal}
                    >
                      <span>+ Add New Piece</span>
                    </button>
                  </div>
                )}
              </section>
            </div>
          ) : null}


          {/* ── SECTION: BANNERS ───────────────────────────────────────────── */}
          {activeSection === "banners" ? (
            <div className={styles.contentGrid}>
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
                          {banner.mediaType === "video" ? (
                            <video className={styles.bannerMedia} src={banner.image} muted loop playsInline autoPlay />
                          ) : (
                            <img className={styles.bannerMedia} src={banner.image} alt={banner.title} />
                          )}
                        </div>

                        <div className={styles.bannerBody}>
                          <div>
                            <h4 className={`display ${styles.bannerTitle}`}>{banner.title}</h4>
                            <p className={styles.bannerSubtitle}>{banner.subtitle || "No subtitle"}</p>
                          </div>
                          <div className={styles.bannerFoot}>
                            <span>Pos: {banner.position}</span>
                            <span>{banner.active ? "Active" : "Draft"}</span>
                          </div>
                          <div className={styles.bannerActions}>
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
                  </div>
                )}
              </section>

              <aside className={styles.formPanel}>
                <div className={styles.sectionHeadCompact}>
                  <p className="eyebrow">Banner Form</p>
                  <h3 className={`display ${styles.sectionTitle}`}>{editingBannerId ? "Edit Banner" : "Upload Banner"}</h3>
                </div>

                <form className={styles.form} onSubmit={handleBannerUpload}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Title</span>
                    <input
                      className={styles.fieldInput}
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      required
                    />
                  </label>

                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Subtitle</span>
                    <input
                      className={styles.fieldInput}
                      value={form.subtitle}
                      onChange={(event) => setForm((current) => ({ ...current, subtitle: event.target.value }))}
                    />
                  </label>

                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Link URL</span>
                    <input
                      className={styles.fieldInput}
                      placeholder="/shop or #collections"
                      value={form.link}
                      onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))}
                    />
                  </label>

                  <div className={styles.inlineFields}>
                    <label className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>Position</span>
                      <input
                        className={styles.fieldInput}
                        type="number"
                        min="0"
                        value={form.position}
                        onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))}
                      />
                    </label>

                    <label className={`${styles.fieldGroup} ${styles.checkboxGroup}`}>
                      <span className={styles.fieldLabel}>Visibility</span>
                      <span className={styles.toggleWrap}>
                        <input
                          type="checkbox"
                          checked={form.active}
                          onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                        />
                        <span>{form.active ? "Active" : "Draft"}</span>
                      </span>
                    </label>
                  </div>

                  <label className={`${styles.fieldGroup} ${styles.uploadField}`}>
                    <span className={styles.fieldLabel}>{editingBannerId ? "Replace Media (optional)" : "Image or MP4 Video"}</span>
                    <input
                      key={fileInputKey}
                      className={styles.fileInput}
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      onChange={(event) => setForm((current) => ({ ...current, media: event.target.files?.[0] || null }))}
                    />
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
            </div>
          ) : null}

          {/* ── SECTION: ORDERS ────────────────────────────────────────────── */}
          {activeSection === "orders" ? (
            <div className={styles.contentGridSingle}>
              <section className={styles.tablePanel}>
                <div className={styles.sectionHead}>
                  <div>
                    <p className="eyebrow">Registry</p>
                    <h3 className={`display ${styles.sectionTitle}`}>Customer Orders</h3>
                  </div>
                  <button type="button" className={`btn ${styles.refreshBtn}`} onClick={loadOrders}>
                    <span>{refreshingOrders ? "Refreshing..." : "Refresh"}</span>
                    <span className="btn-arrow">→</span>
                  </button>
                </div>

                {orderList.length ? (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Customer</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th>Items</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderList.map((order) => (
                          <tr key={order.id}>
                            <td><code>{order.orderNumber || order.id}</code></td>
                            <td>{order.shippingName || order.user?.name || "Guest"}</td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td><span className={styles.tagBadge}>{order.status}</span></td>
                            <td>{order.paymentStatus || "unpaid"}</td>
                            <td>{getOrderItemCount(order)}</td>
                            <td>₹{Number(order.total || 0).toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.placeholderState}>
                    <p className="eyebrow">No Orders</p>
                    <h4 className={`display ${styles.placeholderTitle}`}>No orders found.</h4>
                  </div>
                )}
              </section>
            </div>
          ) : null}

          {/* ── SECTION: PAYMENTS ──────────────────────────────────────────── */}
          {activeSection === "payments" ? (
            <div className={styles.contentGridSingle}>
              <section className={styles.tablePanel}>
                <div className={styles.sectionHead}>
                  <div>
                    <p className="eyebrow">Ledger</p>
                    <h3 className={`display ${styles.sectionTitle}`}>Payment Transactions</h3>
                  </div>
                </div>

                {paymentRows.length ? (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Customer</th>
                          <th>Date</th>
                          <th>Method</th>
                          <th>Status</th>
                          <th>Transaction ID</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentRows.map((row) => (
                          <tr key={row.key}>
                            <td><code>{row.orderNumber}</code></td>
                            <td>{row.userName}</td>
                            <td>{formatDate(row.createdAt)}</td>
                            <td>{row.paymentMode}</td>
                            <td><span className={styles.tagBadge}>{row.paymentStatus}</span></td>
                            <td><code>{row.paymentId}</code></td>
                            <td>₹{Number(row.amount || 0).toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.placeholderState}>
                    <p className="eyebrow">No Transactions</p>
                    <h4 className={`display ${styles.placeholderTitle}`}>No payment entries recorded yet.</h4>
                  </div>
                )}
              </section>
            </div>
          ) : null}

          {/* ── SECTION: USERS ─────────────────────────────────────────────── */}
          {activeSection === "users" ? (
            <div className={styles.contentGridSingle}>
              <section className={styles.tablePanel}>
                <div className={styles.sectionHead}>
                  <div>
                    <p className="eyebrow">Accounts</p>
                    <h3 className={`display ${styles.sectionTitle}`}>Registered Users</h3>
                  </div>
                  <button type="button" className={`btn ${styles.refreshBtn}`} onClick={loadUsers}>
                    <span>{refreshingUsers ? "Refreshing..." : "Refresh"}</span>
                    <span className="btn-arrow">→</span>
                  </button>
                </div>

                {userList.length ? (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Joined</th>
                          <th>Total Spend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userList.map((entry) => (
                          <tr key={entry.id}>
                            <td>{entry.name}</td>
                            <td>{entry.email}</td>
                            <td><span className={styles.tagBadge}>{entry.role}</span></td>
                            <td>{formatDate(entry.createdAt)}</td>
                            <td>₹{Number(entry.totalSpend || 0).toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.placeholderState}>
                    <p className="eyebrow">No Users</p>
                    <h4 className={`display ${styles.placeholderTitle}`}>No registered users yet.</h4>
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </section>
      </div>

      {/* ── PRODUCT ADD / EDIT MODAL ────────────────────────────────────────── */}
      {isProductModalOpen && (
        <div className={styles.modalBackdrop} onClick={(e) => { if (e.target === e.currentTarget) closeProductModal(); }}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <div>
                <p className="eyebrow">{editingProductId ? "Update Catalogue" : "New Piece"}</p>
                <h3 className={`display ${styles.modalTitle}`}>
                  {editingProductId ? `Edit "${productForm.name}"` : "Add New Product"}
                </h3>
              </div>
              <button type="button" className={styles.modalCloseBtn} onClick={closeProductModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleProductSave} className={styles.modalBody}>
              {/* Section 1: Basic Product Information */}
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}>
                  <span style={{ color: "var(--gold-muted)", fontWeight: 600 }}>01</span>
                  <h4 className={styles.formSectionTitle}>Essential Information</h4>
                </div>

                <div className={styles.form}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Product Name *</span>
                    <input
                      className={styles.fieldInput}
                      placeholder="e.g. Ivory Silk Bandhgala Set"
                      value={productForm.name}
                      onChange={(e) => setProductForm((curr) => ({ ...curr, name: e.target.value }))}
                      required
                    />
                  </label>

                  <div className={styles.formRow3}>
                    <label className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>Collection *</span>
                      <input
                        className={styles.fieldInput}
                        list="collection-options"
                        placeholder="e.g. ASAYA, ROOMANI..."
                        value={productForm.collection}
                        onChange={(e) => setProductForm((curr) => ({ ...curr, collection: e.target.value.toUpperCase() }))}
                        required
                      />
                      <datalist id="collection-options">
                        {collectionsSummary.map((c) => (
                          <option key={c.name} value={c.name} />
                        ))}
                      </datalist>
                    </label>

                    <label className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>Category *</span>
                      <select
                        className={styles.fieldInput}
                        value={productForm.category}
                        onChange={(e) => setProductForm((curr) => ({ ...curr, category: e.target.value }))}
                      >
                        <option value="Men's Wear">Men's Wear</option>
                        <option value="Women's Wear">Women's Wear</option>
                      </select>
                    </label>

                    <label className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>Sub Category *</span>
                      <input
                        className={styles.fieldInput}
                        placeholder="Kurta, Sherwani, Lehenga..."
                        value={productForm.subCategory}
                        onChange={(e) => setProductForm((curr) => ({ ...curr, subCategory: e.target.value }))}
                        required
                      />
                    </label>
                  </div>

                  <div className={styles.inlineFields}>
                    <label className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>SKU / Style Code</span>
                      <input
                        className={styles.fieldInput}
                        placeholder="e.g. HR-AS-01"
                        value={productForm.sku}
                        onChange={(e) => setProductForm((curr) => ({ ...curr, sku: e.target.value, styleCode: e.target.value }))}
                      />
                    </label>

                    <label className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>Slug (URL Key)</span>
                      <input
                        className={styles.fieldInput}
                        placeholder="Auto-generated from name if blank"
                        value={productForm.slug}
                        onChange={(e) => setProductForm((curr) => ({ ...curr, slug: e.target.value }))}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing & Stock */}
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}>
                  <span style={{ color: "var(--gold-muted)", fontWeight: 600 }}>02</span>
                  <h4 className={styles.formSectionTitle}>Pricing & Stock</h4>
                </div>

                <div className={styles.formRow3}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Selling Price (₹) *</span>
                    <input
                      className={styles.fieldInput}
                      type="number"
                      min="0"
                      placeholder="28500"
                      value={productForm.price}
                      onChange={(e) => setProductForm((curr) => ({ ...curr, price: e.target.value }))}
                      required
                    />
                  </label>

                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>MRP / Original (₹)</span>
                    <input
                      className={styles.fieldInput}
                      type="number"
                      min="0"
                      placeholder="32000 (optional)"
                      value={productForm.mrp}
                      onChange={(e) => setProductForm((curr) => ({ ...curr, mrp: e.target.value }))}
                    />
                  </label>

                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Stock Status / Qty</span>
                    <input
                      className={styles.fieldInput}
                      placeholder="MTO or quantity"
                      value={productForm.stock}
                      onChange={(e) => setProductForm((curr) => ({ ...curr, stock: e.target.value }))}
                    />
                  </label>
                </div>
              </div>

              {/* Section 3: Craft & Specifications */}
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}>
                  <span style={{ color: "var(--gold-muted)", fontWeight: 600 }}>03</span>
                  <h4 className={styles.formSectionTitle}>Craft, Fabric & Sizing</h4>
                </div>

                <div className={styles.form}>
                  <div className={styles.inlineFields}>
                    <label className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>Fabric</span>
                      <input
                        className={styles.fieldInput}
                        placeholder="e.g. Pure Matka Silk, Raw Silk"
                        value={productForm.fabric}
                        onChange={(e) => setProductForm((curr) => ({ ...curr, fabric: e.target.value }))}
                      />
                    </label>

                    <label className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>Available Sizes (comma-separated)</span>
                      <input
                        className={styles.fieldInput}
                        placeholder="S,M,L,XL,XXL,Custom"
                        value={productForm.sizes}
                        onChange={(e) => setProductForm((curr) => ({ ...curr, sizes: e.target.value }))}
                      />
                    </label>
                  </div>

                  <div className={styles.inlineFields}>
                    <label className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>Wash & Cloth Care</span>
                      <input
                        className={styles.fieldInput}
                        placeholder="Dry Clean Only"
                        value={productForm.clothCare}
                        onChange={(e) => setProductForm((curr) => ({ ...curr, clothCare: e.target.value }))}
                      />
                    </label>

                    <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", paddingTop: "1.2rem" }}>
                      <label className={styles.toggleWrap} style={{ cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={productForm.active}
                          onChange={(e) => setProductForm((curr) => ({ ...curr, active: e.target.checked }))}
                        />
                        <span>Active in Store</span>
                      </label>

                      <label className={styles.toggleWrap} style={{ cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={productForm.featured}
                          onChange={(e) => setProductForm((curr) => ({ ...curr, featured: e.target.checked }))}
                        />
                        <span>Featured on Home</span>
                      </label>
                    </div>
                  </div>

                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Description / Craft Highlights</span>
                    <textarea
                      className={`${styles.fieldInput} ${styles.textarea}`}
                      rows={3}
                      placeholder="Detail the embroidery, silhouette, styling notes..."
                      value={productForm.description}
                      onChange={(e) => setProductForm((curr) => ({ ...curr, description: e.target.value }))}
                    />
                  </label>
                </div>
              </div>

              {/* Section 4: Imagery */}
              <div className={styles.formSection} style={{ borderBottom: "none", marginBottom: 0 }}>
                <div className={styles.formSectionHeader}>
                  <span style={{ color: "var(--gold-muted)", fontWeight: 600 }}>04</span>
                  <h4 className={styles.formSectionTitle}>Product Imagery</h4>
                </div>

                {modalExistingImages.length > 0 && (
                  <div>
                    <span className={styles.fieldLabel} style={{ marginBottom: "0.4rem", display: "block" }}>
                      Current Images ({modalExistingImages.length}) — Click ✕ to remove
                    </span>
                    <div className={styles.imageThumbsGrid}>
                      {modalExistingImages.map((url, idx) => (
                        <div key={url + idx} className={styles.thumbItem}>
                          <img src={url} alt={`Piece image ${idx + 1}`} className={styles.thumbImg} />
                          <button
                            type="button"
                            className={styles.thumbRemoveBtn}
                            onClick={() => removeModalImage(idx)}
                            title="Remove image"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label className={styles.fieldGroup} style={{ marginTop: "0.5rem" }}>
                  <span className={styles.fieldLabel}>Add Image URLs (Direct Web Links or Google Drive links)</span>
                  <textarea
                    className={`${styles.fieldInput} ${styles.textarea}`}
                    rows={2}
                    placeholder="Paste one or more URLs separated by line breaks or commas..."
                    value={modalNewImageUrls}
                    onChange={(e) => setModalNewImageUrls(e.target.value)}
                  />
                  <span className={styles.uploadHint}>
                    Tip: Google Drive share links (e.g. drive.google.com/file/d/...) are auto-converted to high-res web links.
                  </span>
                </label>

                <label className={`${styles.fieldGroup} ${styles.uploadField}`} style={{ marginTop: "0.75rem" }}>
                  <span className={styles.fieldLabel}>Or Upload Local Images from Computer</span>
                  <input
                    key={productFileInputKey}
                    className={styles.fileInput}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setModalFiles(Array.from(e.target.files || []))}
                  />
                  {modalFiles.length > 0 && (
                    <span className={styles.uploadHint} style={{ color: "var(--charcoal)", fontWeight: 500 }}>
                      Selected {modalFiles.length} file(s) to upload.
                    </span>
                  )}
                </label>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.ghostBtn} onClick={closeProductModal}>
                  Cancel
                </button>
                <button className="btn btn-dark" type="submit" disabled={savingProduct}>
                  <span>{savingProduct ? "Saving..." : editingProductId ? "Save Changes" : "Create Piece"}</span>
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG ────────────────────────────────────── */}
      {productToDelete && (
        <div className={styles.modalBackdrop} onClick={(e) => { if (e.target === e.currentTarget) setProductToDelete(null); }}>
          <div className={styles.confirmDialog}>
            <div className={styles.confirmIcon}>🗑️</div>
            <h3 className={styles.confirmTitle}>Delete Product?</h3>
            <p className={styles.confirmCopy}>
              Are you sure you want to delete this piece? It will be permanently removed from your online store catalogue.
            </p>

            <div className={styles.confirmCard}>
              {productToDelete.images?.[0] ? (
                <img src={productToDelete.images[0]} alt={productToDelete.name} className={styles.productThumb} />
              ) : (
                <div className={styles.productThumbFallback}>No image</div>
              )}
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--charcoal)" }}>{productToDelete.name}</h4>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.76rem", color: "rgba(26,21,18,0.55)" }}>
                  <code>{productToDelete.sku || productToDelete.styleCode || productToDelete.slug}</code> • ₹{Number(productToDelete.price || 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.ghostBtn}
                style={{ flex: 1 }}
                onClick={() => setProductToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                style={{ flex: 1, background: "#b71c1c", color: "#ffffff", borderColor: "#b71c1c" }}
                disabled={deletingProductId === productToDelete.id}
                onClick={confirmDeleteProduct}
              >
                {deletingProductId === productToDelete.id ? "Deleting..." : "Yes, Delete Piece"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}