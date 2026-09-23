const GUEST_CART_KEY = "hr_guest_cart";
const GUEST_WISHLIST_KEY = "hr_guest_wishlist";

function parseStored(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function normalizeSize(size) {
  return String(size || "").trim().toUpperCase();
}

export function getGuestCart() {
  if (typeof window === "undefined") return [];
  return parseStored(window.localStorage.getItem(GUEST_CART_KEY), []);
}

export function setGuestCart(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function clearGuestCart() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_CART_KEY);
}

export function addGuestCartItem(item) {
  const cart = getGuestCart();
  const size = normalizeSize(item.size);
  const idx = cart.findIndex((entry) => entry.productId === item.productId && normalizeSize(entry.size) === size);

  if (idx === -1) {
    cart.push({
      productId: item.productId,
      slug: item.slug || "",
      name: item.name || "",
      detail: item.detail || "",
      collection: item.collection || "",
      price: Number(item.price || 0),
      image: item.image || null,
      size,
      quantity: Math.max(1, Number(item.quantity || 1)),
      inStock: item.inStock !== false,
    });
  } else {
    cart[idx] = {
      ...cart[idx],
      quantity: Math.max(1, Number(cart[idx].quantity || 1) + Math.max(1, Number(item.quantity || 1))),
    };
  }

  setGuestCart(cart);
  return cart;
}

export function updateGuestCartQuantity(productId, size, quantity) {
  const normalizedSize = normalizeSize(size);
  const cart = getGuestCart().map((item) => {
    if (item.productId === productId && normalizeSize(item.size) === normalizedSize) {
      return { ...item, quantity: Math.max(1, Number(quantity || 1)) };
    }
    return item;
  });
  setGuestCart(cart);
  return cart;
}

export function removeGuestCartItem(productId, size) {
  const normalizedSize = normalizeSize(size);
  const cart = getGuestCart().filter((item) => !(item.productId === productId && normalizeSize(item.size) === normalizedSize));
  setGuestCart(cart);
  return cart;
}

export function getGuestWishlist() {
  if (typeof window === "undefined") return [];
  return parseStored(window.localStorage.getItem(GUEST_WISHLIST_KEY), []);
}

export function setGuestWishlist(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
}

export function clearGuestWishlist() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_WISHLIST_KEY);
}

export function addGuestWishlistItem(item) {
  const list = getGuestWishlist();
  if (!list.some((entry) => entry.productId === item.productId)) {
    list.push({
      productId: item.productId,
      slug: item.slug || "",
      name: item.name || "",
      detail: item.detail || "",
      collection: item.collection || "",
      price: Number(item.price || 0),
      image: item.image || null,
      inStock: item.inStock !== false,
    });
  }
  setGuestWishlist(list);
  return list;
}

export function removeGuestWishlistItem(productId) {
  const list = getGuestWishlist().filter((item) => item.productId !== productId);
  setGuestWishlist(list);
  return list;
}

export async function syncGuestDataToUser() {
  const cartItems = getGuestCart();
  const wishlistItems = getGuestWishlist();

  if (cartItems.length) {
    await fetch("/api/cart/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cartItems.map((item) => ({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
        })),
      }),
    }).catch(() => {});
    clearGuestCart();
  }

  if (wishlistItems.length) {
    await fetch("/api/wishlist/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: wishlistItems.map((item) => ({ productId: item.productId })),
      }),
    }).catch(() => {});
    clearGuestWishlist();
  }
}
