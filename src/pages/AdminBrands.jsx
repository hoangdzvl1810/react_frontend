import { useEffect, useMemo, useState } from "react";
import { createItem, getCollection, updateItem } from "../services/api";
import { getNextNumericId } from "../utils/getNextNumericId";
import { useToast } from "../context/ToastContext";
import { PromptModal, ConfirmModal } from "../components/Modal";
import Pagination from "../components/Pagination";

const ITEMS_PER_PAGE = 9;

export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [sort, setSort] = useState("");
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [editNameModal, setEditNameModal] = useState({ isOpen: false, brand: null });
  const [toggleStatusModal, setToggleStatusModal] = useState({ isOpen: false, brand: null });

  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [brandsData, productsData] = await Promise.all([
        getCollection("brands"),
        getCollection("products"),
      ]);

      setBrands(brandsData || []);
      setProducts(productsData || []);
    } catch (e) {
      toast.error("Không thể tải danh sách thương hiệu.");
    }
  };

  const productCountByBrand = useMemo(() => {
    return products.reduce((acc, product) => {
      acc[String(product.brandId)] = (acc[String(product.brandId)] || 0) + 1;
      return acc;
    }, {});
  }, [products]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, sort]);

  const sortedBrands = useMemo(() => {
    return [...brands]
      .filter((brand) =>
        brand.name.toLowerCase().includes(keyword.trim().toLowerCase())
      )
      .sort((a, b) => {
        const countA = productCountByBrand[a.id] || 0;
        const countB = productCountByBrand[b.id] || 0;

        if (sort === "productDesc") return countB - countA;
        if (sort === "productAsc") return countA - countB;
        return a.id - b.id;
      });
  }, [brands, keyword, sort, productCountByBrand]);

  const totalPages = Math.ceil(sortedBrands.length / ITEMS_PER_PAGE) || 1;

  const paginatedBrands = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedBrands.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedBrands, currentPage]);

  const handleAddBrand = async (e) => {
    e.preventDefault();

    if (/\s{2,}/.test(name)) {
      toast.error("Tên thương hiệu không được chứa nhiều dấu cách liên tiếp! Vui lòng nhập lại.");
      return;
    }

    const trimmedName = name.trim();

    if (trimmedName === "") {
      toast.error("Tên thương hiệu không được để trống!");
      return;
    }

    const isDuplicate = brands.some(
      (b) => b.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      toast.error("Tên thương hiệu đã tồn tại trong hệ thống!");
      return;
    }

    try {
      const createdBrand = await createItem("brands", {
        id: getNextNumericId(brands),
        name: trimmedName,
        status: "ACTIVE",
      });

      setBrands([...brands, createdBrand]);
      setName("");
      setShowForm(false);
      toast.success("Thêm thương hiệu thành công!");
    } catch (err) {
      toast.error("Không thể thêm thương hiệu!");
    }
  };

  const handleEditNameConfirm = async (newName) => {
    const { brand } = editNameModal;
    if (!brand) return;

    if (/\s{2,}/.test(newName)) {
      toast.error("Tên thương hiệu không được chứa nhiều dấu cách liên tiếp! Vui lòng nhập lại.");
      return;
    }

    setEditNameModal({ isOpen: false, brand: null });

    const trimmedNewName = newName.trim();

    if (trimmedNewName === "") {
      toast.error("Tên thương hiệu không được để trống!");
      return;
    }

    if (trimmedNewName === brand.name) return;

    const isDuplicate = brands.some(
      (b) =>
        b.id !== brand.id &&
        b.name.trim().toLowerCase() === trimmedNewName.toLowerCase()
    );

    if (isDuplicate) {
      toast.error("Tên thương hiệu này đã tồn tại trong hệ thống!");
      return;
    }

    try {
      const updatedBrand = await updateItem("brands", brand.id, {
        name: trimmedNewName,
      });

      setBrands(
        brands.map((item) =>
          item.id === brand.id ? { ...item, ...updatedBrand } : item
        )
      );

      toast.success("Cập nhật tên thương hiệu thành công!");
    } catch (error) {
      toast.error("Không thể cập nhật tên thương hiệu!");
    }
  };

  const handleToggleStatusConfirm = async () => {
    const { brand } = toggleStatusModal;
    if (!brand) return;
    setToggleStatusModal({ isOpen: false, brand: null });

    const nextStatus = brand.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";

    try {
      const updatedBrand = await updateItem("brands", brand.id, {
        status: nextStatus,
      });

      setBrands(
        brands.map((item) =>
          item.id === brand.id ? { ...item, ...updatedBrand } : item
        )
      );

      toast.success(
        `Đã ${nextStatus === "ACTIVE" ? "kích hoạt" : "vô hiệu hóa"} thương hiệu "${brand.name}"`
      );
    } catch (err) {
      toast.error("Không thể cập nhật trạng thái thương hiệu!");
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
          <h2>Quản Lý Thương Hiệu ({brands.length})</h2>
          <p style={{ color: "#64748b", marginTop: "4px", fontSize: "14px" }}>
            Quản lý các hãng đối tác công nghệ và linh kiện.
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
            <option value="productDesc">Nhiều sản phẩm nhất</option>
            <option value="productAsc">Ít sản phẩm nhất</option>
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
            {showForm ? "Đóng form" : "Thêm thương hiệu"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddBrand}
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
            placeholder="Nhập tên thương hiệu (VD: MSI, Intel, AMD)..."
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
            <th>Tên thương hiệu</th>
            <th>Số sản phẩm</th>
            <th>Trạng thái</th>
            <th style={{ textAlign: "center" }}>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {paginatedBrands.map((brand) => (
            <tr key={brand.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "14px 16px", fontWeight: "bold" }}>
                #{brand.id}
              </td>

              <td style={{ fontWeight: "600", fontSize: "15px" }}>
                {brand.name}
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
                  {productCountByBrand[brand.id] || 0} sản phẩm
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
                      brand.status === "INACTIVE" ? "#fee2e2" : "#dcfce7",
                    color:
                      brand.status === "INACTIVE" ? "#b91c1c" : "#15803d",
                  }}
                >
                  {brand.status === "INACTIVE"
                    ? "Vô hiệu hóa"
                    : "Đang hoạt động"}
                </span>
              </td>

              <td style={{ textAlign: "center" }}>
                <div style={{ display: "inline-flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setEditNameModal({ isOpen: true, brand })}
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
                      setToggleStatusModal({ isOpen: true, brand })
                    }
                    style={{
                      padding: "6px 14px",
                      backgroundColor:
                        brand.status === "INACTIVE" ? "#10b981" : "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                      minWidth: "95px",
                    }}
                  >
                    {brand.status === "INACTIVE" ? "Kích hoạt" : "Khóa"}
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {paginatedBrands.length === 0 && (
            <tr>
              <td colSpan="5" style={{ padding: "30px", textAlign: "center" }}>
                Không tìm thấy thương hiệu nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={sortedBrands.length}
        pageSize={ITEMS_PER_PAGE}
      />

      {/* Edit Name Modal */}
      <PromptModal
        isOpen={editNameModal.isOpen}
        title="Đổi tên thương hiệu"
        label="Tên thương hiệu mới"
        defaultValue={editNameModal.brand?.name || ""}
        placeholder="Nhập tên thương hiệu mới..."
        confirmText="Lưu thay đổi"
        onConfirm={handleEditNameConfirm}
        onCancel={() => setEditNameModal({ isOpen: false, brand: null })}
        validate={(newName) => {
          const trimmed = newName.trim().toLowerCase();
          if (!trimmed) return null;
          const isDuplicate = brands.some(
            (b) =>
              b.id !== editNameModal.brand?.id &&
              b.name.trim().toLowerCase() === trimmed
          );
          if (isDuplicate) return "Tên thương hiệu này đã tồn tại trong hệ thống!";
          return null;
        }}
      />

      {/* Toggle Status Modal */}
      <ConfirmModal
        isOpen={toggleStatusModal.isOpen}
        title="Xác nhận đổi trạng thái"
        message={`Bạn có chắc muốn ${
          toggleStatusModal.brand?.status === "INACTIVE"
            ? "kích hoạt"
            : "vô hiệu hóa"
        } thương hiệu "${toggleStatusModal.brand?.name}"?`}
        confirmText="Xác nhận"
        type={
          toggleStatusModal.brand?.status === "ACTIVE"
            ? "danger"
            : "primary"
        }
        onConfirm={handleToggleStatusConfirm}
        onCancel={() => setToggleStatusModal({ isOpen: false, brand: null })}
      />
    </div>
  );
}
