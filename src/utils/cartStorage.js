//Đây là key cũ của giỏ hàng.
const LEGACY_CART_KEY = "cart";

//Đọc JSON an toàn.
const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

//Đọc thông tin account.
export const getStoredAccount = () =>
  safeParse(localStorage.getItem("account"), null);

//Xác định giỏ hàng thuộc về ai.
const getOwnerSuffix = () => {
  const account = getStoredAccount();
  return account?.id != null ? `user:${account.id}` : "guest";
};

//Sinh key lưu cart.
const getCartKey = () => `cart:${getOwnerSuffix()}`;

//Sinh key lưu buynow.
const getBuyNowKey = () => `buyNowCart:${getOwnerSuffix()}`;

/**
 * 
 * [
   {productId:1, quantity:2},
   {productId:1, quantity:3},
   {productId:2, quantity:1}
]

[
   {productId:1, quantity:5},
   {productId:2, quantity:1}
]
 */
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

/**
 * Dùng để chuyển dữ liệu cũ.
 * cart đã tồn tại thì chuyển sang cart:user:5
 */
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

/***
 * 
iPhone
quantity =2

Người dùng thêm

quantity =3

thì

nextQuantity =5
 */
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
  const guestCart = normalizeCart(
    safeParse(localStorage.getItem(guestKey), []),
  );
  if (!guestCart.length) return;

  const userCart = normalizeCart(safeParse(localStorage.getItem(userKey), []));
  localStorage.setItem(
    userKey,
    JSON.stringify(normalizeCart([...userCart, ...guestCart])),
  );
  localStorage.removeItem(guestKey);
};

export const readBuyNowCart = () =>
  normalizeCart(safeParse(localStorage.getItem(getBuyNowKey()), []));

export const writeBuyNowCart = (items) => {
  const normalized = normalizeCart(items);
  localStorage.setItem(getBuyNowKey(), JSON.stringify(normalized));
  return normalized;
};

export const clearBuyNowCart = () => localStorage.removeItem(getBuyNowKey());
