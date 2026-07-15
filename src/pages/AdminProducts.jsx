import { useEffect, useState } from "react";
import { createItem, getCollection, updateItem } from "../services/api";
import { getProductImage } from "../utils/productImages";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [sort, setSort] = useState("");
  const [keyword, setKeyword] = useState("");
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    categoryId: "",
    brandId: "",
    image: "",
    description: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const productsData = await getCollection("products");
    const categoriesData = await getCollection("categories");
    const brandsData = await getCollection("brands");

    setProducts(productsData);
    setCategories(categoriesData);
    setBrands(brandsData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    const normalizedName = form.name.trim().toLowerCase();
    const isDuplicate = products.some(
      (p) => p.name.trim().toLowerCase() === normalizedName
    );

    if (isDuplicate) {
      alert("Tên sản phẩm đã tồn tại trong hệ thống!");
      return;
    }

    const priceNum = Number(form.price);
    const stockNum = Number(form.stock);

    if (priceNum < 0) {
      alert("Giá bán không được âm!");
      return;
    }

    if (stockNum < 0) {
      alert("Số lượng tồn kho không được âm!");
      return;
    }

    const newProduct = {
      name: form.name.trim(),
      price: priceNum,
      stock: stockNum,
      categoryId: Number(form.categoryId),
      brandId: Number(form.brandId),
      image: form.image,
      description: form.description,
      status: form.status,
    };

    const createdProduct = await createItem("products", newProduct);

    setProducts([...products, createdProduct]);
    setShowForm(false);

    setForm({
      name: "",
      price: "",
      stock: "",
      categoryId: "",
      brandId: "",
      image: "",
      description: "",
      status: "ACTIVE",
    });

    alert("Thêm sản phẩm thành công!");
  };

  const handleToggleStatus = async (product) => {
    const nextStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const updatedProduct = await updateItem("products", product.id, {
      status: nextStatus,
    });

    setProducts(
      products.map((item) =>
        item.id === product.id ? { ...item, ...updatedProduct } : item,
      ),
    );
  };
  const handleUpdateStock = async (product) => {
    const newStock = window.prompt("Nhập số lượng tồn kho mới:", product.stock);

    if (newStock === null) return;

    if (newStock.trim() === "") {
      alert("Số lượng không được để trống!");
      return;
    }

    if (Number(newStock) < 0 || isNaN(Number(newStock))) {
      alert("Số lượng phải là số hợp lệ và không được âm!");
      return;
    }

    const updatedProduct = await updateItem("products", product.id, {
      stock: Number(newStock),
    });

    setProducts(
      products.map((item) =>
        item.id === product.id ? { ...item, ...updatedProduct } : item,
      ),
    );

    alert("Cập nhật số lượng thành công!");
  };
  const handleEditName = async (product) => {
    const newName = window.prompt("Nhập tên sản phẩm mới:", product.name);

    // Người dùng bấm Cancel
    if (newName === null) return;

    const trimmedNewName = newName.trim();

    // Chỉ nhập khoảng trắng hoặc để trống
    if (trimmedNewName === "") {
      alert("Tên sản phẩm không được để trống!");
      return;
    }

    // Không thay đổi tên
    if (trimmedNewName === product.name) {
      return;
    }

    const isDuplicate = products.some(
      (p) => p.id !== product.id && p.name.trim().toLowerCase() === trimmedNewName.toLowerCase()
    );

    if (isDuplicate) {
      alert("Tên sản phẩm này đã tồn tại trong hệ thống!");
      return;
    }

    try {
      const updatedProduct = await updateItem("products", product.id, {
        name: newName.trim(),
      });

      setProducts(
        products.map((item) =>
          item.id === product.id ? { ...item, ...updatedProduct } : item,
        ),
      );

      alert("Cập nhật tên sản phẩm thành công!");
    } catch (error) {
      alert("Không thể cập nhật tên sản phẩm!");
    }
  };
  const sortedProducts = [...products]
    .filter((product) =>
      product.name.toLowerCase().includes(keyword.trim().toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === "priceAsc") return a.price - b.price;
      if (sort === "priceDesc") return b.price - a.price;
      if (sort === "stockAsc") return a.stock - b.stock;
      if (sort === "stockDesc") return b.stock - a.stock;
      return a.id - b.id;
    });

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
        minHeight: "60vh",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #eee",
          paddingBottom: "15px",
        }}
      >
        <h2>Quản Lý Sản Phẩm</h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm kiếm theo tên..."
            style={{
              height: "42px",
              width: "240px",
              padding: "0 12px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontWeight: "bold",
            }}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              height: "42px",
              padding: "0 12px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontWeight: "bold",
            }}
          >
            <option value="">Sắp xếp mặc định</option>
            <option value="priceAsc">Giá thấp đến cao</option>
            <option value="priceDesc">Giá cao đến thấp</option>
            <option value="stockAsc">Tồn kho ít đến nhiều</option>
            <option value="stockDesc">Tồn kho nhiều đến ít</option>
          </select>

          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-submit"
            style={{
              width: "auto",
              padding: "10px 22px",
            }}
          >
            + Thêm Sản Phẩm Mới
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddProduct}
          style={{
            marginTop: "20px",
            background: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
          }}
        >
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Tên sản phẩm"
            required
          />
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Giá bán"
            type="number"
            required
          />
          <input
            name="stock"
            value={form.stock}
            onChange={handleChange}
            placeholder="Tồn kho"
            type="number"
            required
          />
          <input
            name="image"
            value={form.image}
            onChange={handleChange}
            placeholder="Tên ảnh VD: product.jpg"
            required
          />

          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            required
          >
            <option value="">Chọn danh mục</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            name="brandId"
            value={form.brandId}
            onChange={handleChange}
            required
          >
            <option value="">Chọn thương hiệu</option>
            {brands.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select name="status" value={form.status} onChange={handleChange}>
            <option value="ACTIVE">Đang bán</option>
            <option value="INACTIVE">Ngừng bán</option>
          </select>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Mô tả sản phẩm"
            required
            style={{ gridColumn: "1 / 3", minHeight: "90px" }}
          />

          <button
            type="submit"
            className="btn-submit"
            style={{ gridColumn: "1 / 3" }}
          >
            Lưu sản phẩm
          </button>
        </form>
      )}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
          backgroundColor: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: "#f8f9fa",
              textAlign: "left",
              borderBottom: "2px solid #dee2e6",
            }}
          >
            <th style={{ padding: "15px" }}>ID</th>
            <th>Hình ảnh</th>
            <th>Tên sản phẩm</th>
            <th>Giá bán</th>
            <th>Tồn kho</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {sortedProducts.map((product) => (
            <tr key={product.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "15px", fontWeight: "bold" }}>
                {product.id}
              </td>

              <td>
                <img
                  src={getProductImage(product.image)}
                  alt={product.name}
                  style={{
                    width: "50px",
                    height: "50px",
                    objectFit: "contain",
                  }}
                  onError={(e) =>
                    (e.target.src = "https://via.placeholder.com/50")
                  }
                />
              </td>

              <td style={{ maxWidth: "300px", fontWeight: "500" }}>
                {product.name}
              </td>

              <td style={{ color: "#e53e3e", fontWeight: "bold" }}>
                {product.price.toLocaleString("vi-VN")}đ
              </td>

              <td>
                <span
                  style={{
                    padding: "3px 8px",
                    backgroundColor: product.stock > 0 ? "#d4edda" : "#f8d7da",
                    color: product.stock > 0 ? "#155724" : "#721c24",
                    borderRadius: "10px",
                    fontSize: "14px",
                  }}
                >
                  {product.stock}
                </span>
              </td>
              <td>
                <span
                  style={{
                    padding: "5px 10px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: "bold",
                    backgroundColor:
                      product.status === "INACTIVE" ? "#f8d7da" : "#d4edda",
                    color:
                      product.status === "INACTIVE" ? "#721c24" : "#155724",
                  }}
                >
                  {product.status === "INACTIVE"
                    ? "Vô hiệu hóa"
                    : "Đang hoạt động"}
                </span>
              </td>

              <td>
                <button
                  onClick={() => handleEditName(product)}
                  style={{
                    padding: "8px 12px",
                    marginRight: "8px",
                    backgroundColor: "#ffc107",
                    color: "#000",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Sửa tên
                </button>
                <button
                  onClick={() => handleUpdateStock(product)}
                  style={{
      
                    padding: "8px 12px",
                    marginRight: "8px",
                    backgroundColor: "#0d6efd",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Cập nhật số lượng
                </button>
                <button
                  onClick={() => handleToggleStatus(product)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor:
                      product.status === "INACTIVE" ? "#28a745" : "#dc3545",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    minWidth: "110px",
                  }}
                >
                  {product.status === "INACTIVE" ? "Kích hoạt" : "Vô hiệu hóa"}
                </button>
              </td>
            </tr>
          ))}

          {sortedProducts.length === 0 && (
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>
                Chưa có sản phẩm nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
