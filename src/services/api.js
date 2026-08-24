import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:9999"
    : "http://localhost:9999");

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3000,
});

// Helper for local mock storage key
const STORAGE_PREFIX = "probuild_db_";

const getLocalCollection = (collection) => {
  try {
    const key = `${STORAGE_PREFIX}${collection}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (e) {
    return [];
  }
};

const saveLocalCollection = (collection, data) => {
  try {
    const key = `${STORAGE_PREFIX}${collection}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to persist to localStorage", e);
  }
};

// Fallback query filtering for offline mode
const filterLocalData = (data, params = {}) => {
  let result = [...data];

  Object.entries(params).forEach(([key, val]) => {
    if (key === "_sort" || key === "_order" || key === "_limit" || key === "_page") return;
    if (val !== undefined && val !== null && val !== "") {
      result = result.filter((item) => String(item[key]) === String(val));
    }
  });

  if (params._sort) {
    const sortField = params._sort;
    const isDesc = params._order === "desc";
    result.sort((a, b) => {
      const valA = a[sortField] ?? "";
      const valB = b[sortField] ?? "";
      if (valA < valB) return isDesc ? 1 : -1;
      if (valA > valB) return isDesc ? -1 : 1;
      return 0;
    });
  }

  return result;
};

export const getCollection = async (collection, params = {}) => {
  try {
    const res = await API.get(`/${collection}`, { params });
    // Update local cache for offline usage
    if (Array.isArray(res.data) && Object.keys(params).length === 0) {
      saveLocalCollection(collection, res.data);
    }
    return res.data;
  } catch (error) {
    console.warn(`[API] Server unavailable at ${API_BASE_URL}, using fallback data for '${collection}'`);
    const local = getLocalCollection(collection);
    return filterLocalData(local, params);
  }
};

export const getItem = async (collection, id) => {
  try {
    const res = await API.get(`/${collection}/${id}`);
    return res.data;
  } catch (error) {
    const local = getLocalCollection(collection);
    const found = local.find((item) => String(item.id) === String(id));
    if (found) return found;
    throw error;
  }
};

export const createItem = async (collection, payload) => {
  let finalPayload = { ...payload };

  if (!finalPayload.id) {
    try {
      const items = await getCollection(collection);
      const maxId = (items || []).reduce((max, item) => {
        const num = Number(item.id);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      finalPayload.id = String(maxId + 1);
    } catch {
      finalPayload.id = String(Date.now());
    }
  } else {
    finalPayload.id = String(finalPayload.id);
  }

  try {
    const res = await API.post(`/${collection}`, finalPayload);
    // sync local
    const local = getLocalCollection(collection);
    saveLocalCollection(collection, [...local, res.data]);
    return res.data;
  } catch (error) {
    const local = getLocalCollection(collection);
    saveLocalCollection(collection, [...local, finalPayload]);
    return finalPayload;
  }
};

export const updateItem = async (collection, id, payload) => {
  try {
    const res = await API.patch(`/${collection}/${id}`, payload);
    const local = getLocalCollection(collection);
    const updated = local.map((item) =>
      String(item.id) === String(id) ? { ...item, ...res.data } : item
    );
    saveLocalCollection(collection, updated);
    return res.data;
  } catch (error) {
    const local = getLocalCollection(collection);
    let updatedItem = null;
    const updated = local.map((item) => {
      if (String(item.id) === String(id)) {
        updatedItem = { ...item, ...payload };
        return updatedItem;
      }
      return item;
    });
    saveLocalCollection(collection, updated);
    return updatedItem || { ...payload, id };
  }
};

export const deleteItem = async (collection, id) => {
  try {
    const res = await API.delete(`/${collection}/${id}`);
    const local = getLocalCollection(collection);
    saveLocalCollection(collection, local.filter((item) => String(item.id) !== String(id)));
    return res.data;
  } catch (error) {
    const local = getLocalCollection(collection);
    saveLocalCollection(collection, local.filter((item) => String(item.id) !== String(id)));
    return { success: true };
  }
};

export const getProducts = () => getCollection("products");
export const getCategories = () => getCollection("categories");
export const getBrands = () => getCollection("brands");
export const getUsers = () => getCollection("users");
export const getOrders = () => getCollection("orders");

export const getProduct = (id) => getItem("products", id);
export const createProduct = (data) => createItem("products", data);
export const updateProduct = (id, data) => updateItem("products", id, data);
export const deleteProduct = (id) => deleteItem("products", id);

export const getCategory = (id) => getItem("categories", id);
export const createCategory = (data) => createItem("categories", data);
export const updateCategory = (id, data) => updateItem("categories", id, data);
export const deleteCategory = (id) => deleteItem("categories", id);

export default API;
