import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:9999",
});

export const getCollection = (collection, params = {}) =>
    API.get(`/${collection}`, { params }).then(res => res.data);

export const getItem = (collection, id) =>
    API.get(`/${collection}/${id}`).then(res => res.data);

export const createItem = (collection, payload) =>
    API.post(`/${collection}`, payload).then(res => res.data);

export const updateItem = (collection, id, payload) =>
    API.patch(`/${collection}/${id}`, payload).then(res => res.data);

export const deleteItem = (collection, id) =>
    API.delete(`/${collection}/${id}`);


export const getProducts = () => API.get("/products");
export const getCategories = () => API.get("/categories");
export const getBrands = () => API.get("/brands");
export const getUsers = () => API.get("/users");
export const getOrders = () => API.get("/orders");

export const getProduct = (id) => API.get(`/products/${id}`);
export const createProduct = (data) => API.post("/products", data);
export const updateProduct = (id, data) => API.patch(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);

export const getCategory = (id) => API.get(`/categories/${id}`);
export const createCategory = (data) => API.post("/categories", data);
export const updateCategory = (id, data) => API.patch(`/categories/${id}`, data);
export const deleteCategory = (id) => API.delete(`/categories/${id}`);

export default API;