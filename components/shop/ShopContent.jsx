"use client";
import { useState, useMemo, useCallback } from "react";
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
  minPrice: 5000,
  maxPrice: 50000,
};

export default function ShopContent() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Derived: filtered + sorted products
  const filteredProducts = useMemo(() => {
    let list = [...PRODUCTS];

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subCategory.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q) ||
          p.collection.toLowerCase().includes(q)
      );
    }

    if (filters.gender !== "All") {
      list = list.filter((p) => p.category === filters.gender);
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
      (p) => p.price >= filters.minPrice && p.price <= filters.maxPrice
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
  }, [filters, sort]);

  const totalPages = Math.ceil(filteredProducts.length / PER_PAGE);
  const pagedProducts = filteredProducts.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  // Filter updaters
  const setGender = useCallback((val) => {
    setFilters((f) => ({ ...f, gender: val }));
    setPage(1);
  }, []);

  const toggleSubCategory = useCallback((val) => {
    setFilters((f) => {
      const next = f.subCategories.includes(val)
        ? f.subCategories.filter((v) => v !== val)
        : [...f.subCategories, val];
      return { ...f, subCategories: next };
    });
    setPage(1);
  }, []);

  const toggleCollection = useCallback((val) => {
    setFilters((f) => {
      const next = f.collections.includes(val)
        ? f.collections.filter((v) => v !== val)
        : [...f.collections, val];
      return { ...f, collections: next };
    });
    setPage(1);
  }, []);

  const toggleFabric = useCallback((val) => {
    setFilters((f) => {
      const next = f.fabrics.includes(val)
        ? f.fabrics.filter((v) => v !== val)
        : [...f.fabrics, val];
      return { ...f, fabrics: next };
    });
    setPage(1);
  }, []);

  const setSearch = useCallback((val) => {
    setFilters((f) => ({ ...f, search: val }));
    setPage(1);
  }, []);

  const setPriceRange = useCallback((min, max) => {
    setFilters((f) => ({ ...f, minPrice: min, maxPrice: max }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  }, []);

  const handleSort = useCallback((val) => {
    setSort(val);
    setPage(1);
  }, []);

  const activeFilterCount =
    (filters.gender !== "All" ? 1 : 0) +
    filters.subCategories.length +
    filters.collections.length +
    filters.fabrics.length;

  return (
    <>
      <ShopHero />

      <div className={styles.shopLayout}>
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
            subCategories={SUB_CATEGORIES}
            collections={COLLECTIONS}
            fabrics={FABRICS}
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
        <section className={styles.productArea} aria-label="Products">
          <ShopGrid
            products={pagedProducts}
            total={filteredProducts.length}
            page={page}
            totalPages={totalPages}
            perPage={PER_PAGE}
            sort={sort}
            sortOptions={SORT_OPTIONS}
            onSort={handleSort}
            onPage={setPage}
          />
        </section>
      </div>
    </>
  );
}
