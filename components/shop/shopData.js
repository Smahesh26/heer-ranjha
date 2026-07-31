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
  "Sarees",
];

export const COLLECTIONS = [
  "Nayi Leher",
  "Asaya",
  "Roomani",
  "Ganga Jamuni",
];

export const FABRICS = [
  "Matka Silk",
  "Dupion",
  "Chanderi",
  "Raw Silk",
  "Organza",
  "Tissue",
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
