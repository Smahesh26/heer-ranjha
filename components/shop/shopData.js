// shopData.js - Heer Ranjha product catalogue

import productsData from './products.json';

export const PRODUCTS = productsData;


export const CATEGORIES = [
  { label: "All", value: "All" },
  { label: "Men", value: "Men" },
  { label: "Women", value: "Women" },
];

export const SUB_CATEGORIES = [
  "Kurta Sets",
  "Nehru Jackets",
  "Sherwanis",
  "Bandhgalas",
  "Lehengas",
  "Co-ord Sets",
  "Suit Sets",
  "Palazzo Sets",
  "Jacket Sets",
  "Sarees",
];

const DEFAULT_COLLECTIONS = [
  "ASAYA",
  "NAYI LEHER",
  "GANGA JAMUNI",
  "ROOMANI",
];

const activeDerivedCollections = Array.from(
  new Set(
    PRODUCTS.filter((p) => p.active !== false)
      .map((p) => String(p.collection || "").trim().toUpperCase())
      .filter(Boolean)
  )
);

export const COLLECTIONS =
  activeDerivedCollections.length > 0 ? activeDerivedCollections : DEFAULT_COLLECTIONS;

export const FABRICS = [
  "Matka Silk",
  "Dupion Silk",
  "Chanderi",
  "Linen",
  "Raw Silk",
  "Tissue",
  "Organza",
  "Georgette",
];

export const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Name: A to Z", value: "name_asc" },
];

export const PER_PAGE = 12;

export function formatPrice(n) {
  return "\u20B9" + n.toLocaleString("en-IN");
}
