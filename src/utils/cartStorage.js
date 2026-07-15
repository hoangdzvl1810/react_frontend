const LEGACY_CART_KEY = "cart";

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const getStoredAccount = () =>
  safeParse(localStorage.getItem("account"), null);

const getOwnerSuffix = () => {
  const account = getStoredAccount();
  return account?.id != null ? `user:${account.id}` : "guest";
};

const getCartKey = () => `cart:${getOwnerSuffix()}`;
const getBuyNowKey = () => `buyNowCart:${getOwnerSuffix()}`;

const normalizeCart = (items) => {
  if (!Array.isArray(items)) return [];

  const quantities = new Map();

  items.forEach((item) => {
    const productId = Number(item?.productId ?? item?.id);
    const quantity = Number(item?.quantity);

    if (!Number.isInteger(productId) || productId <= 0) return;
    if (!Number.isInteger(quantity) || quantity <= 0) return;

    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  });

  return Array.from(quantities, ([productId, quantity]) => ({
    productId,
    quantity,
  }));
};

const migrateLegacyCart = (targetKey) => {
  if (localStorage.getItem(targetKey) !== null) return;

  const legacyCart = normalizeCart(
    safeParse(localStorage.getItem(LEGACY_CART_KEY), []),
  );

  localStorage.setItem(targetKey, JSON.stringify(legacyCart));
  localStorage.removeItem(LEGACY_CART_KEY);
};

export const readCart = () => {
  const key = getCartKey();
  migrateLegacyCart(key);
  return normalizeCart(safeParse(localStorage.getItem(key), []));
};

export const writeCart = (items) => {
  const normalized = normalizeCart(items);
  localStorage.setItem(getCartKey(), JSON.stringify(normalized));
  window.dispatchEvent(new Event("cartUpdated"));
  return normalized;
};

export const addCartItem = (productId, quantity, stock) => {
  const cart = readCart();
  const current = cart.find((item) => item.productId === Number(productId));
  const nextQuantity = (current?.quantity || 0) + Number(quantity);

  if (!Number.isInteger(nextQuantity) || nextQuantity <= 0) {
    return { ok: false, reason: "INVALID_QUANTITY" };
  }

  if (nextQuantity > Number(stock)) {
    return { ok: false, reason: "OUT_OF_STOCK" };
  }

  if (current) {
    current.quantity = nextQuantity;
  } else {
    cart.push({ productId: Number(productId), quantity: nextQuantity });
  }

  writeCart(cart);
  return { ok: true };
};

export const clearCart = () => writeCart([]);

export const moveGuestCartToUser = (userId) => {
  const guestKey = "cart:guest";
  const userKey = `cart:user:${userId}`;
  const guestCart = normalizeCart(safeParse(localStorage.getItem(guestKey), []));
  if (!guestCart.length) return;

  const userCart = normalizeCart(safeParse(localStorage.getItem(userKey), []));
  localStorage.setItem(userKey, JSON.stringify(normalizeCart([...userCart, ...guestCart])));
  localStorage.removeItem(guestKey);
};

export const readBuyNowCart = () =>
  normalizeCart(safeParse(localStorage.getItem(getBuyNowKey()), []));

export const writeBuyNowCart = (items) => {
  const normalized = normalizeCart(items);
  localStorage.setItem(getBuyNowKey(), JSON.stringify(normalized));
  return normalized;
};

export const clearBuyNowCart = () =>
  localStorage.removeItem(getBuyNowKey());
