"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ShopHero from "./ShopHero";
import ShopSidebar from "./ShopSidebar";
import ShopGrid from "./ShopGrid";
import {
  PRODUCTS,
  COLLECTIONS,
  SUB_CATEGORIES,
  FABRICS,
  SORT_OPTIONS,
  PER_PAGE,
} from "./shopData";
import styles from "./shop.module.css";

const INITIAL_FILTERS = {
  gender: "All",
  subCategories: [],
  collections: [],
  fabrics: [],
  search: "",
  minPrice: 0,
  maxPrice: 500000,
};

export default function ShopContent() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState(PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch live products so Excel uploads / dashboard changes reflect immediately
  useEffect(() => {
    let isMounted = true;
    async function loadLiveProducts() {
      try {
        const res = await fetch("/api/products?active=true", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && Array.isArray(data?.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error("Failed to load live products in ShopContent:", err);
      }
    }
    loadLiveProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const [filters, setFilters] = useState(() => {
    const initialGender = searchParams.get("gender") || searchParams.get("category");
    const initialCollection = searchParams.get("collection");
    const initialSubCategory = searchParams.get("subCategory");
    const initialSearch = searchParams.get("q") || searchParams.get("search");

    const f = { ...INITIAL_FILTERS };
    if (initialGender && ["Men", "Women"].includes(initialGender)) {
      f.gender = initialGender;
    }
    if (initialCollection) {
      f.collections = [initialCollection];
    }
    if (initialSubCategory) {
      f.subCategories = [initialSubCategory];
    }
    if (initialSearch) {
      f.search = initialSearch;
    }
    return f;
  });

  useEffect(() => {
    const initialGender = searchParams.get("gender") || searchParams.get("category");
    const initialCollection = searchParams.get("collection");
    const initialSubCategory = searchParams.get("subCategory");
    const initialSearch = searchParams.get("q") || searchParams.get("search");

    setFilters((f) => {
      const next = { ...f };
      if (initialGender && ["Men", "Women"].includes(initialGender)) {
        next.gender = initialGender;
      }
      if (initialCollection) {
        next.collections = [initialCollection];
      }
      if (initialSubCategory) {
        next.subCategories = [initialSubCategory];
      }
      if (typeof initialSearch === "string") {
        next.search = initialSearch;
      }
      return next;
    });
  }, [searchParams]);

  const genderFilteredProducts = useMemo(() => {
    let list = products;
    if (filters.gender !== "All") {
      const g = filters.gender.toLowerCase();
      list = list.filter((p) => {
        const cat = String(p.category || "").toLowerCase();
        if (g === "men") {
          return cat.includes("men") && !cat.includes("women");
        } else if (g === "women") {
          return cat.includes("women");
        }
        return true;
      });
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.subCategory || "").toLowerCase().includes(q) ||
          (p.color && p.color.toLowerCase().includes(q)) ||
          (p.fabric && p.fabric.toLowerCase().includes(q)) ||
          (p.collection && p.collection.toLowerCase().includes(q))
      );
    }
    list = list.filter(
      (p) => Number(p.price || 0) >= filters.minPrice && Number(p.price || 0) <= filters.maxPrice
    );
    return list;
  }, [products, filters.gender, filters.search, filters.minPrice, filters.maxPrice]);

  const subCategories = useMemo(() => {
    const productSubCats = products.map((p) => p.subCategory).filter(Boolean);
    const available = Array.from(new Set([...SUB_CATEGORIES, ...productSubCats]));

    let list = genderFilteredProducts;
    if (filters.collections.length > 0) list = list.filter((p) => filters.collections.includes(p.collection));
    if (filters.fabrics.length > 0) list = list.filter((p) => filters.fabrics.includes(p.fabric));
    const dynamicValues = [...new Set(list.map((p) => p.subCategory).filter(Boolean))];

    filters.subCategories.forEach((sc) => {
      if (!dynamicValues.includes(sc)) dynamicValues.push(sc);
    });

    return dynamicValues.length ? dynamicValues : available;
  }, [genderFilteredProducts, filters.collections, filters.fabrics, filters.subCategories, products]);

  const collections = useMemo(() => {
    const productCollections = products.map((p) => p.collection).filter(Boolean);
    const available = Array.from(new Set([...COLLECTIONS, ...productCollections]));

    let list = genderFilteredProducts;
    if (filters.subCategories.length > 0) list = list.filter((p) => filters.subCategories.includes(p.subCategory));
    if (filters.fabrics.length > 0) list = list.filter((p) => filters.fabrics.includes(p.fabric));
    const dynamicValues = [...new Set(list.map((p) => p.collection).filter(Boolean))];

    filters.collections.forEach((c) => {
      if (!dynamicValues.includes(c)) dynamicValues.push(c);
    });

    return dynamicValues.length ? dynamicValues : available;
  }, [genderFilteredProducts, filters.subCategories, filters.fabrics, filters.collections, products]);

  const fabrics = useMemo(() => {
    const productFabrics = products.map((p) => p.fabric).filter(Boolean);
    const available = Array.from(new Set([...FABRICS, ...productFabrics]));

    let list = genderFilteredProducts;
    if (filters.subCategories.length > 0) list = list.filter((p) => filters.subCategories.includes(p.subCategory));
    if (filters.collections.length > 0) list = list.filter((p) => filters.collections.includes(p.collection));
    const dynamicValues = [...new Set(list.map((p) => p.fabric).filter(Boolean))];

    filters.fabrics.forEach((f) => {
      if (!dynamicValues.includes(f)) dynamicValues.push(f);
    });

    return dynamicValues.length ? dynamicValues : available;
  }, [genderFilteredProducts, filters.subCategories, filters.collections, filters.fabrics, products]);

  // Derived: filtered + sorted products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.subCategory || "").toLowerCase().includes(q) ||
          (p.color && p.color.toLowerCase().includes(q)) ||
          (p.fabric && p.fabric.toLowerCase().includes(q)) ||
          (p.collection && p.collection.toLowerCase().includes(q))
      );
    }

    if (filters.gender !== "All") {
      const g = filters.gender.toLowerCase();
      list = list.filter((p) => {
        const cat = String(p.category || "").toLowerCase();
        if (g === "men") {
          return cat.includes("men") && !cat.includes("women");
        } else if (g === "women") {
          return cat.includes("women");
        }
        return true;
      });
    }

    if (filters.subCategories.length > 0) {
      list = list.filter((p) => filters.subCategories.includes(p.subCategory));
    }

    if (filters.collections.length > 0) {
      list = list.filter((p) => filters.collections.includes(p.collection));
    }

    if (filters.fabrics.length > 0) {
      list = list.filter((p) => filters.fabrics.includes(p.fabric));
    }

    list = list.filter(
      (p) => Number(p.price || 0) >= filters.minPrice && Number(p.price || 0) <= filters.maxPrice
    );

    switch (sort) {
      case "price_asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "name_asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break; // newest = original order
    }

    return list;
  }, [filters, sort, products]);

  const totalPages = Math.ceil(filteredProducts.length / PER_PAGE);
  const pagedProducts = filteredProducts.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Helper to smoothly scroll to the top of the products section
  const scrollToProducts = useCallback(() => {
    setTimeout(() => {
      const target = document.getElementById("shop-products-top") || document.getElementById("shop-layout");
      if (target) {
        const navHeight =
          parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-height")) || 120;
        const rect = target.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - navHeight - 16;
        window.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
      }
    }, 10);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    scrollToProducts();
  }, [scrollToProducts]);

  // Filter updaters
  const setGender = useCallback((val) => {
    setFilters((f) => ({ ...f, gender: val }));
    setPage(1);
    scrollToProducts();
  }, [scrollToProducts]);

  const toggleSubCategory = useCallback((val) => {
    setFilters((f) => {
      const next = f.subCategories.includes(val)
        ? f.subCategories.filter((v) => v !== val)
        : [...f.subCategories, val];
      return { ...f, subCategories: next };
    });
    setPage(1);
    scrollToProducts();
  }, [scrollToProducts]);

  const toggleCollection = useCallback((val) => {
    setFilters((f) => {
      const next = f.collections.includes(val)
        ? f.collections.filter((v) => v !== val)
        : [...f.collections, val];
      return { ...f, collections: next };
    });
    setPage(1);
    scrollToProducts();
  }, [scrollToProducts]);

  const toggleFabric = useCallback((val) => {
    setFilters((f) => {
      const next = f.fabrics.includes(val)
        ? f.fabrics.filter((v) => v !== val)
        : [...f.fabrics, val];
      return { ...f, fabrics: next };
    });
    setPage(1);
    scrollToProducts();
  }, [scrollToProducts]);

  const setSearch = useCallback((val) => {
    setFilters((f) => ({ ...f, search: val }));
    setPage(1);
    scrollToProducts();
  }, [scrollToProducts]);

  const setPriceRange = useCallback((min, max) => {
    setFilters((f) => ({ ...f, minPrice: min, maxPrice: max }));
    setPage(1);
    scrollToProducts();
  }, [scrollToProducts]);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
    scrollToProducts();
  }, [scrollToProducts]);

  const handleSort = useCallback((val) => {
    setSort(val);
    setPage(1);
    scrollToProducts();
  }, [scrollToProducts]);

  const activeFilterCount =
    (filters.gender !== "All" ? 1 : 0) +
    filters.subCategories.length +
    filters.collections.length +
    filters.fabrics.length;

  return (
    <>
      <ShopHero />

      <div id="shop-layout" className={styles.shopLayout}>
        {/* Mobile top bar */}
        <div className={styles.mobileTopBar}>
          <button
            className={styles.mobileFilterBtn}
            onClick={() => setSidebarOpen(true)}
            aria-expanded={sidebarOpen}
            aria-controls="shop-sidebar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className={styles.filterBadge}>{activeFilterCount}</span>
            )}
          </button>
          <span className={styles.mobileCount}>
            {filteredProducts.length} piece{filteredProducts.length !== 1 ? "s" : ""}
          </span>
          <select
            className={styles.mobileSortSelect}
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className={styles.sidebarOverlay}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          id="shop-sidebar"
          className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
        >
          <div className={styles.sidebarMobileHeader}>
            <span className={styles.sidebarMobileTitle}>Filters</span>
            <button
              className={styles.sidebarCloseBtn}
              onClick={() => setSidebarOpen(false)}
              aria-label="Close filters"
            >
              &times;
            </button>
          </div>

          <ShopSidebar
            filters={filters}
            subCategories={subCategories}
            collections={collections}
            fabrics={fabrics}
            onGender={setGender}
            onSubCategory={toggleSubCategory}
            onCollection={toggleCollection}
            onFabric={toggleFabric}
            onSearch={setSearch}
            onPriceRange={setPriceRange}
            onClear={clearFilters}
            activeFilterCount={activeFilterCount}
          />
        </aside>

        {/* Product area */}
        <section id="shop-products-top" className={styles.productArea} aria-label="Products">
          <ShopGrid
            products={pagedProducts}
            total={filteredProducts.length}
            loading={loading}
            page={page}
            totalPages={totalPages}
            perPage={PER_PAGE}
            sort={sort}
            sortOptions={SORT_OPTIONS}
            onSort={handleSort}
            onPage={handlePageChange}
          />
        </section>
      </div>
    </>
  );
}
