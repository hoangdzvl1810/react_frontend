import { useEffect, useState, useMemo } from "react";
import { createItem, getCollection, updateItem } from "../services/api";
import { getProductImage } from "../utils/productImages";
import { getNextNumericId } from "../utils/getNextNumericId";
import { useToast } from "../context/ToastContext";
import { PromptModal, ConfirmModal } from "../components/Modal";
import Pagination from "../components/Pagination";

const ITEMS_PER_PAGE = 9;

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [sort, setSort] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [editNameModal, setEditNameModal] = useState({ isOpen: false, product: null });
  const [editStockModal, setEditStockModal] = useState({ isOpen: false, product: null });
  const [toggleStatusModal, setToggleStatusModal] = useState({ isOpen: false, product: null });

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

  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData, brandsData] = await Promise.all([
        getCollection("products"),
        getCollection("categories"),
        getCollection("brands"),
      ]);

      setProducts(productsData || []);
      setCategories(categoriesData || []);
      setBrands(brandsData || []);
    } catch (e) {
      toast.error("Không thể tải danh sách sản phẩm.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (/\s{2,}/.test(form.name)) {
      toast.error("Tên sản phẩm không được chứa nhiều dấu cách liên tiếp! Vui lòng nhập lại.");
      return;
    }

    const normalizedName = form.name.trim().toLowerCase();
    const isDuplicate = products.some(
      (p) => p.name.trim().toLowerCase() === normalizedName
    );

    if (isDuplicate) {
      toast.error("Tên sản phẩm đã tồn tại trong hệ thống!");
      return;
    }

    const priceNum = Number(form.price);
    const stockNum = Number(form.stock);

    if (priceNum < 0) {
      toast.error("Giá bán không được âm!");
      return;
    }

    if (stockNum < 0) {
      toast.error("Số lượng tồn kho không được âm!");
      return;
    }

    const newProduct = {
      id: getNextNumericId(products),
      name: form.name.trim(),
      price: priceNum,
      stock: stockNum,
      categoryId: Number(String(form.categoryId)),
      brandId: Number(String(form.brandId)),
      image: form.image.trim(),
      description: form.description.trim(),
      status: form.status,
    };

    try {
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
      toast.success("Thêm sản phẩm thành công!");
    } catch (err) {
      toast.error("Không thể lưu sản phẩm lúc này!");
    }
  };

  const handleToggleStatusConfirm = async () => {
    const { product } = toggleStatusModal;
    if (!product) return;
    setToggleStatusModal({ isOpen: false, product: null });

    const nextStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      const updatedProduct = await updateItem("products", product.id, {
        status: nextStatus,
      });

      setProducts(
        products.map((item) =>
          item.id === product.id ? { ...item, ...updatedProduct } : item
        )
      );

      toast.success(
        `Đã ${nextStatus === "ACTIVE" ? "kích hoạt" : "vô hiệu hóa"} sản phẩm "${product.name}"`
      );
    } catch (err) {
      toast.error("Không thể cập nhật trạng thái sản phẩm!");
    }
  };

  const handleUpdateStockConfirm = async (newStockStr) => {
    const { product } = editStockModal;
    if (!product) return;
    setEditStockModal({ isOpen: false, product: null });

    const num = Number(newStockStr);
    if (isNaN(num) || num < 0) {
      toast.error("Số lượng phải là số hợp lệ không âm!");
      return;
    }

    try {
      const updatedProduct = await updateItem("products", product.id, {
        stock: Math.floor(num),
      });

      setProducts(
        products.map((item) =>
          item.id === product.id ? { ...item, ...updatedProduct } : item
        )
      );

      toast.success(`Cập nhật tồn kho thành công (${num} sp)!`);
    } catch (err) {
      toast.error("Không thể cập nhật tồn kho!");
    }
  };

  const handleEditNameConfirm = async (newName) => {
    const { product } = editNameModal;
    if (!product) return;

    if (/\s{2,}/.test(newName)) {
      toast.error("Tên sản phẩm không được chứa nhiều dấu cách liên tiếp! Vui lòng nhập lại.");
      return;
    }

    setEditNameModal({ isOpen: false, product: null });

    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
      toast.error("Tên sản phẩm không được để trống!");
      return;
    }

    if (trimmedNewName === product.name) return;

    const isDuplicate = products.some(
      (p) =>
        p.id !== product.id &&
        p.name.trim().toLowerCase() === trimmedNewName.toLowerCase()
    );

    if (isDuplicate) {
      toast.error("Tên sản phẩm này đã tồn tại trong hệ thống!");
      return;
    }

    try {
      const updatedProduct = await updateItem("products", product.id, {
        name: trimmedNewName,
      });

      setProducts(
        products.map((item) =>
          item.id === product.id ? { ...item, ...updatedProduct } : item
        )
      );

      toast.success("Cập nhật tên sản phẩm thành công!");
    } catch (err) {
      toast.error("Không thể cập nhật tên sản phẩm!");
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, sort]);

  const sortedProducts = useMemo(() => {
    let result = products.filter((product) =>
      product.name.toLowerCase().includes(keyword.trim().toLowerCase())
    );

    return result.sort((a, b) => {
      if (sort === "priceAsc") return a.price - b.price;
      if (sort === "priceDesc") return b.price - a.price;
      if (sort === "stockAsc") return a.stock - b.stock;
      if (sort === "stockDesc") return b.stock - a.stock;
      return a.id - b.id;
    });
  }, [products, keyword, sort]);

  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE) || 1;

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProducts, currentPage]);

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
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2>Quản Lý Sản Phẩm ({products.length})</h2>
          <p style={{ color: "#64748b", marginTop: "4px", fontSize: "14px" }}>
            Thêm mới, sửa thông tin, cập nhật kho và trạng thái bán.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
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
              borderRadius: "8px",
              border: "1.5px solid #cbd5e1",
              fontSize: "14px",
            }}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              height: "42px",
              padding: "0 12px",
              borderRadius: "8px",
              border: "1.5px solid #cbd5e1",
              fontWeight: "600",
              fontSize: "14px",
              background: "#fff",
            }}
          >
            <option value="">Sắp xếp mặc định</option>
            <option value="priceAsc">Giá thấp đến cao</option>
            <option value="priceDesc">Giá cao đến thấp</option>
            <option value="stockAsc">Tồn kho ít đến nhiều</option>
            <option value="stockDesc">Tồn kho nhiều đến ít</option>
          </select>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="btn-submit"
            style={{
              width: "auto",
              padding: "10px 20px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <i className={showForm ? "fa-solid fa-xmark" : "fa-solid fa-plus"}></i>
            {showForm ? "Đóng form" : "Thêm sản phẩm mới"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddProduct}
          style={{
            marginTop: "20px",
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            border: "1px solid #e2e8f0",
          }}
        >
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Tên sản phẩm *"
            required
            className="modal-input"
          />
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Giá bán (VNĐ) *"
            type="number"
            min="0"
            required
            className="modal-input"
          />
          <input
            name="stock"
            value={form.stock}
            onChange={handleChange}
            placeholder="Tồn kho *"
            type="number"
            min="0"
            required
            className="modal-input"
          />
          <input
            name="image"
            value={form.image}
            onChange={handleChange}
            placeholder="Tên file ảnh (VD: cpu-i9.jpg) *"
            required
            className="modal-input"
          />

          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            required
            className="modal-input"
          >
            <option value="">-- Chọn danh mục * --</option>
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
            className="modal-input"
          >
            <option value="">-- Chọn thương hiệu * --</option>
            {brands.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="modal-input"
          >
            <option value="ACTIVE">Đang bán (ACTIVE)</option>
            <option value="INACTIVE">Ngừng bán (INACTIVE)</option>
          </select>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Mô tả chi tiết sản phẩm *"
            required
            style={{
              gridColumn: "1 / -1",
              minHeight: "90px",
              padding: "12px",
              borderRadius: "8px",
              border: "1.5px solid #cbd5e1",
              fontFamily: "inherit",
              fontSize: "14px",
            }}
          />

          <button
            type="submit"
            className="btn-submit"
            style={{ gridColumn: "1 / -1", height: "46px" }}
          >
            <i className="fa-solid fa-floppy-disk"></i> Lưu sản phẩm vào hệ thống
          </button>
        </form>
      )}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "24px",
          backgroundColor: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: "#f8fafc",
              textAlign: "left",
              borderBottom: "2px solid #e2e8f0",
            }}
          >
            <th style={{ padding: "14px 16px" }}>ID</th>
            <th>Hình ảnh</th>
            <th>Tên sản phẩm</th>
            <th>Giá bán</th>
            <th>Tồn kho</th>
            <th>Trạng thái</th>
            <th style={{ textAlign: "center" }}>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {paginatedProducts.map((product) => (
            <tr key={product.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "14px 16px", fontWeight: "bold" }}>
                #{product.id}
              </td>

              <td>
                <img
                  src={getProductImage(product.image)}
                  alt={product.name}
                  style={{
                    width: "48px",
                    height: "48px",
                    objectFit: "contain",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                  }}
                  onError={(e) =>
                    (e.target.src = "https://via.placeholder.com/50")
                  }
                />
              </td>

              <td style={{ maxWidth: "300px", fontWeight: "600" }}>
                {product.name}
              </td>

              <td style={{ color: "#dc2626", fontWeight: "700" }}>
                {product.price.toLocaleString("vi-VN")}đ
              </td>

              <td>
                <span
                  style={{
                    padding: "4px 10px",
                    backgroundColor:
                      product.stock > 10
                        ? "#dcfce7"
                        : product.stock > 0
                        ? "#fef3c7"
                        : "#fee2e2",
                    color:
                      product.stock > 10
                        ? "#15803d"
                        : product.stock > 0
                        ? "#b45309"
                        : "#b91c1c",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "700",
                  }}
                >
                  {product.stock} sp
                </span>
              </td>
              <td>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "700",
                    backgroundColor:
                      product.status === "INACTIVE" ? "#fee2e2" : "#dcfce7",
                    color:
                      product.status === "INACTIVE" ? "#b91c1c" : "#15803d",
                  }}
                >
                  {product.status === "INACTIVE"
                    ? "Ngừng bán"
                    : "Đang bán"}
                </span>
              </td>

              <td style={{ textAlign: "center" }}>
                <div style={{ display: "inline-flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setEditNameModal({ isOpen: true, product })
                    }
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "#fef3c7",
                      color: "#b45309",
                      border: "1px solid #fde68a",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                    }}
                    title="Sửa tên sản phẩm"
                  >
                    <i className="fa-solid fa-pen"></i> Sửa tên
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditStockModal({ isOpen: true, product })
                    }
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "#dbeafe",
                      color: "#1d4ed8",
                      border: "1px solid #bfdbfe",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                    }}
                    title="Cập nhật số lượng kho"
                  >
                    <i className="fa-solid fa-boxes-stacked"></i> Kho
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setToggleStatusModal({ isOpen: true, product })
                    }
                    style={{
                      padding: "6px 12px",
                      backgroundColor:
                        product.status === "INACTIVE" ? "#10b981" : "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                      minWidth: "90px",
                    }}
                  >
                    {product.status === "INACTIVE" ? "Kích hoạt" : "Khóa"}
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {paginatedProducts.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "30px" }}>
                Chưa có sản phẩm nào phù hợp.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={sortedProducts.length}
        pageSize={ITEMS_PER_PAGE}
      />

      {/* Edit Name Modal */}
      <PromptModal
        isOpen={editNameModal.isOpen}
        title="Sửa tên sản phẩm"
        label="Tên sản phẩm mới"
        defaultValue={editNameModal.product?.name || ""}
        placeholder="Nhập tên sản phẩm mới..."
        confirmText="Lưu tên mới"
        onConfirm={handleEditNameConfirm}
        onCancel={() => setEditNameModal({ isOpen: false, product: null })}
        validate={(newName) => {
          const trimmed = newName.trim().toLowerCase();
          if (!trimmed) return null;
          const isDuplicate = products.some(
            (p) =>
              p.id !== editNameModal.product?.id &&
              p.name.trim().toLowerCase() === trimmed
          );
          if (isDuplicate) return "Tên sản phẩm này đã tồn tại trong hệ thống!";
          return null;
        }}
      />

      {/* Edit Stock Modal */}
      <PromptModal
        isOpen={editStockModal.isOpen}
        title={`Cập nhật tồn kho - ${editStockModal.product?.name || ""}`}
        label="Số lượng tồn kho mới"
        inputType="number"
        defaultValue={editStockModal.product?.stock ?? 0}
        placeholder="Nhập số lượng tồn kho..."
        confirmText="Cập nhật kho"
        onConfirm={handleUpdateStockConfirm}
        onCancel={() => setEditStockModal({ isOpen: false, product: null })}
      />

      {/* Toggle Status Modal */}
      <ConfirmModal
        isOpen={toggleStatusModal.isOpen}
        title="Xác nhận đổi trạng thái"
        message={`Bạn có chắc muốn ${
          toggleStatusModal.product?.status === "ACTIVE"
            ? "vô hiệu hóa (ngừng bán)"
            : "kích hoạt (mở bán lại)"
        } sản phẩm "${toggleStatusModal.product?.name}" không?`}
        confirmText="Xác nhận"
        type={
          toggleStatusModal.product?.status === "ACTIVE" ? "danger" : "primary"
        }
        onConfirm={handleToggleStatusConfirm}
        onCancel={() => setToggleStatusModal({ isOpen: false, product: null })}
      />
    </div>
  );
}
