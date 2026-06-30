"use client";
import { useState } from "react";
import { formatPrice } from "./shopData";
import styles from "./shop.module.css";

function AccordionSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.filterSection}>
      <button
        className={styles.filterSectionHead}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className={`${styles.filterChevron} ${open ? styles.filterChevronOpen : ""}`} aria-hidden="true">
          &#8249;
        </span>
      </button>
      {open && <div className={styles.filterSectionBody}>{children}</div>}
    </div>
  );
}

export default function ShopSidebar({
  filters,
  subCategories,
  collections,
  fabrics,
  onGender,
  onSubCategory,
  onCollection,
  onFabric,
  onSearch,
  onPriceRange,
  onClear,
  activeFilterCount,
}) {
  const [localMin, setLocalMin] = useState(filters.minPrice);
  const [localMax, setLocalMax] = useState(filters.maxPrice);

  const applyPrice = () => {
    const min = Math.max(5000, Math.min(localMin, localMax - 1000));
    const max = Math.min(50000, Math.max(localMax, min + 1000));
    onPriceRange(min, max);
  };

  return (
    <div className={styles.sidebarInner}>
      {/* Active filter count + clear */}
      {activeFilterCount > 0 && (
        <div className={styles.clearWrap}>
          <span className={styles.clearCount}>{activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active</span>
          <button className={styles.clearBtn} onClick={onClear}>Clear all</button>
        </div>
      )}

      {/* Search */}
      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search pieces..."
          value={filters.search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Search products"
        />
        {filters.search && (
          <button className={styles.searchClear} onClick={() => onSearch("")} aria-label="Clear search">
            &times;
          </button>
        )}
      </div>

      {/* Gender / Category */}
      <AccordionSection title="Shop By">
        <div className={styles.genderPills}>
          {["All", "Men", "Women"].map((g) => (
            <button
              key={g}
              className={`${styles.genderPill} ${filters.gender === g ? styles.genderPillActive : ""}`}
              onClick={() => onGender(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </AccordionSection>

      {/* Sub-categories */}
      <AccordionSection title="Category">
        <ul className={styles.filterList}>
          {subCategories.map((sc) => (
            <li key={sc} className={styles.filterItem}>
              <label className={styles.filterLabel}>
                <input
                  type="checkbox"
                  className={styles.filterCheckbox}
                  checked={filters.subCategories.includes(sc)}
                  onChange={() => onSubCategory(sc)}
                />
                <span className={styles.filterCheckMark} aria-hidden="true" />
                <span className={styles.filterText}>{sc}</span>
              </label>
            </li>
          ))}
        </ul>
      </AccordionSection>

      {/* Collections */}
      <AccordionSection title="Collection">
        <ul className={styles.filterList}>
          {collections.map((col) => (
            <li key={col} className={styles.filterItem}>
              <label className={styles.filterLabel}>
                <input
                  type="checkbox"
                  className={styles.filterCheckbox}
                  checked={filters.collections.includes(col)}
                  onChange={() => onCollection(col)}
                />
                <span className={styles.filterCheckMark} aria-hidden="true" />
                <span className={styles.filterText}>{col}</span>
              </label>
            </li>
          ))}
        </ul>
      </AccordionSection>

      {/* Fabrics */}
      <AccordionSection title="Fabric">
        <ul className={styles.filterList}>
          {fabrics.map((fab) => (
            <li key={fab} className={styles.filterItem}>
              <label className={styles.filterLabel}>
                <input
                  type="checkbox"
                  className={styles.filterCheckbox}
                  checked={filters.fabrics.includes(fab)}
                  onChange={() => onFabric(fab)}
                />
                <span className={styles.filterCheckMark} aria-hidden="true" />
                <span className={styles.filterText}>{fab}</span>
              </label>
            </li>
          ))}
        </ul>
      </AccordionSection>

      {/* Price range */}
      <AccordionSection title="Price Range">
        <div className={styles.priceRange}>
          <div className={styles.priceInputRow}>
            <div className={styles.priceInputWrap}>
              <span className={styles.priceInputPrefix}>&#8377;</span>
              <input
                type="number"
                className={styles.priceInput}
                value={localMin}
                min={5000}
                max={49000}
                step={500}
                onChange={(e) => setLocalMin(Number(e.target.value))}
                onBlur={applyPrice}
                aria-label="Minimum price"
              />
            </div>
            <span className={styles.priceSep}>to</span>
            <div className={styles.priceInputWrap}>
              <span className={styles.priceInputPrefix}>&#8377;</span>
              <input
                type="number"
                className={styles.priceInput}
                value={localMax}
                min={6000}
                max={50000}
                step={500}
                onChange={(e) => setLocalMax(Number(e.target.value))}
                onBlur={applyPrice}
                aria-label="Maximum price"
              />
            </div>
          </div>
          <div className={styles.priceDisplay}>
            {formatPrice(filters.minPrice)} to {formatPrice(filters.maxPrice)}
          </div>
        </div>
      </AccordionSection>
    </div>
  );
}
