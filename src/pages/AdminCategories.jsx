import { useEffect, useMemo, useState } from "react";
import { createItem, getCollection, updateItem } from "../services/api";
import { getNextNumericId } from "../utils/getNextNumericId";
import { useToast } from "../context/ToastContext";
import { PromptModal, ConfirmModal } from "../components/Modal";
import Pagination from "../components/Pagination";

const ITEMS_PER_PAGE = 9;

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [sort, setSort] = useState("");
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [editNameModal, setEditNameModal] = useState({ isOpen: false, category: null });
  const [toggleStatusModal, setToggleStatusModal] = useState({ isOpen: false, category: null });

  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesData, productsData] = await Promise.all([
        getCollection("categories"),
        getCollection("products"),
      ]);

      setCategories(categoriesData || []);
      setProducts(productsData || []);
    } catch (e) {
      toast.error("Không thể tải danh sách danh mục.");
    }
  };

  const productCountByCategory = useMemo(() => {
    return products.reduce((acc, product) => {
      acc[String(product.categoryId)] = (acc[String(product.categoryId)] || 0) + 1;
      return acc;
    }, {});
  }, [products]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, sort]);

  const sortedCategories = useMemo(() => {
    return [...categories]
      .filter((category) =>
        category.name.toLowerCase().includes(keyword.trim().toLowerCase())
      )
      .sort((a, b) => {
        const countA = productCountByCategory[a.id] || 0;
        const countB = productCountByCategory[b.id] || 0;

        if (sort === "productAsc") return countA - countB;
        if (sort === "productDesc") return countB - countA;

        return a.id - b.id;
      });
  }, [categories, keyword, sort, productCountByCategory]);

  const totalPages = Math.ceil(sortedCategories.length / ITEMS_PER_PAGE) || 1;

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedCategories, currentPage]);

  const handleAddCategory = async (e) => {
    e.preventDefault();

    if (/\s{2,}/.test(name)) {
      toast.error("Tên danh mục không được chứa nhiều dấu cách liên tiếp! Vui lòng nhập lại.");
      return;
    }

    const trimmedName = name.trim();

    if (trimmedName === "") {
      toast.error("Tên danh mục không được để trống!");
      return;
    }

    const isDuplicate = categories.some(
      (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      toast.error("Tên danh mục đã tồn tại trong hệ thống!");
      return;
    }

    try {
      const createdCategory = await createItem("categories", {
        id: getNextNumericId(categories),
        name: trimmedName,
        status: "ACTIVE",
      });

      setCategories([...categories, createdCategory]);
      setName("");
      setShowForm(false);
      toast.success("Thêm danh mục thành công!");
    } catch (err) {
      toast.error("Không thể thêm danh mục!");
    }
  };

  const handleEditNameConfirm = async (newName) => {
    const { category } = editNameModal;
    if (!category) return;

    if (/\s{2,}/.test(newName)) {
      toast.error("Tên danh mục không được chứa nhiều dấu cách liên tiếp! Vui lòng nhập lại.");
      return;
    }

    setEditNameModal({ isOpen: false, category: null });

    const trimmedNewName = newName.trim();

    if (trimmedNewName === "") {
      toast.error("Tên danh mục không được để trống!");
      return;
    }

    if (trimmedNewName === category.name) return;

    const isDuplicate = categories.some(
      (c) =>
        c.id !== category.id &&
        c.name.trim().toLowerCase() === trimmedNewName.toLowerCase()
    );

    if (isDuplicate) {
      toast.error("Tên danh mục này đã tồn tại trong hệ thống!");
      return;
    }

    try {
      const updatedCategory = await updateItem("categories", category.id, {
        name: trimmedNewName,
      });

      setCategories(
        categories.map((item) =>
          item.id === category.id ? { ...item, ...updatedCategory } : item
        )
      );

      toast.success("Cập nhật tên danh mục thành công!");
    } catch (error) {
      toast.error("Không thể cập nhật tên danh mục!");
    }
  };

  const handleToggleStatusConfirm = async () => {
    const { category } = toggleStatusModal;
    if (!category) return;
    setToggleStatusModal({ isOpen: false, category: null });

    const nextStatus = category.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";

    try {
      const updatedCategory = await updateItem("categories", category.id, {
        status: nextStatus,
      });

      setCategories(
        categories.map((item) =>
          item.id === category.id ? { ...item, ...updatedCategory } : item
        )
      );

      toast.success(
        `Đã ${nextStatus === "ACTIVE" ? "kích hoạt" : "vô hiệu hóa"} danh mục "${category.name}"`
      );
    } catch (err) {
      toast.error("Không thể cập nhật trạng thái danh mục!");
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1100px",
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
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2>Quản Lý Danh Mục ({categories.length})</h2>
          <p style={{ color: "#64748b", marginTop: "4px", fontSize: "14px" }}>
            Quản lý các nhóm linh kiện máy tính trong cửa hàng.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm kiếm theo tên..."
            style={{
              height: "42px",
              width: "220px",
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
            <option value="productDesc">Nhiều mặt hàng nhất</option>
            <option value="productAsc">Ít mặt hàng nhất</option>
          </select>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="btn-submit"
            style={{
              width: "auto",
              padding: "10px 18px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <i className={showForm ? "fa-solid fa-xmark" : "fa-solid fa-plus"}></i>
            {showForm ? "Đóng form" : "Thêm danh mục"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddCategory}
          style={{
            marginTop: "20px",
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            display: "flex",
            gap: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên danh mục mới (VD: Tản nhiệt nước)..."
            required
            className="modal-input"
            style={{ flex: 1 }}
          />

          <button
            type="submit"
            className="btn-submit"
            style={{ width: "160px", borderRadius: "8px" }}
          >
            <i className="fa-solid fa-floppy-disk"></i> Lưu
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
            <th>Tên danh mục</th>
            <th>Số sản phẩm</th>
            <th>Trạng thái</th>
            <th style={{ textAlign: "center" }}>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {paginatedCategories.map((category) => (
            <tr key={category.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "14px 16px", fontWeight: "bold" }}>
                #{category.id}
              </td>

              <td style={{ fontWeight: "600", fontSize: "15px" }}>
                {category.name}
              </td>

              <td>
                <span
                  style={{
                    padding: "4px 12px",
                    background: "#dbeafe",
                    color: "#1d4ed8",
                    borderRadius: "6px",
                    fontWeight: "700",
                    fontSize: "13px",
                  }}
                >
                  {productCountByCategory[category.id] || 0} sản phẩm
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
                      category.status === "INACTIVE" ? "#fee2e2" : "#dcfce7",
                    color:
                      category.status === "INACTIVE" ? "#b91c1c" : "#15803d",
                  }}
                >
                  {category.status === "INACTIVE"
                    ? "Vô hiệu hóa"
                    : "Đang hoạt động"}
                </span>
              </td>

              <td style={{ textAlign: "center" }}>
                <div style={{ display: "inline-flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setEditNameModal({ isOpen: true, category })
                    }
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#fef3c7",
                      color: "#b45309",
                      border: "1px solid #fde68a",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                    }}
                  >
                    <i className="fa-solid fa-pen"></i> Sửa tên
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setToggleStatusModal({ isOpen: true, category })
                    }
                    style={{
                      padding: "6px 14px",
                      backgroundColor:
                        category.status === "INACTIVE" ? "#10b981" : "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                      minWidth: "95px",
                    }}
                  >
                    {category.status === "INACTIVE"
                      ? "Kích hoạt"
                      : "Khóa"}
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {paginatedCategories.length === 0 && (
            <tr>
              <td colSpan="5" style={{ padding: "30px", textAlign: "center" }}>
                Không tìm thấy danh mục nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={sortedCategories.length}
        pageSize={ITEMS_PER_PAGE}
      />

      {/* Edit Name Modal */}
      <PromptModal
        isOpen={editNameModal.isOpen}
        title="Đổi tên danh mục"
        label="Tên danh mục mới"
        defaultValue={editNameModal.category?.name || ""}
        placeholder="Nhập tên danh mục mới..."
        confirmText="Lưu thay đổi"
        onConfirm={handleEditNameConfirm}
        onCancel={() => setEditNameModal({ isOpen: false, category: null })}
        validate={(newName) => {
          const trimmed = newName.trim().toLowerCase();
          if (!trimmed) return null;
          const isDuplicate = categories.some(
            (c) =>
              c.id !== editNameModal.category?.id &&
              c.name.trim().toLowerCase() === trimmed
          );
          if (isDuplicate) return "Tên danh mục này đã tồn tại trong hệ thống!";
          return null;
        }}
      />

      {/* Toggle Status Modal */}
      <ConfirmModal
        isOpen={toggleStatusModal.isOpen}
        title="Xác nhận đổi trạng thái"
        message={`Bạn có chắc muốn ${
          toggleStatusModal.category?.status === "INACTIVE"
            ? "kích hoạt"
            : "vô hiệu hóa"
        } danh mục "${toggleStatusModal.category?.name}"?`}
        confirmText="Xác nhận"
        type={
          toggleStatusModal.category?.status === "ACTIVE"
            ? "danger"
            : "primary"
        }
        onConfirm={handleToggleStatusConfirm}
        onCancel={() =>
          setToggleStatusModal({ isOpen: false, category: null })
        }
      />
    </div>
  );
}
