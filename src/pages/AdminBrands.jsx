import { useEffect, useMemo, useState } from "react";
import { createItem, getCollection, updateItem } from "../services/api";
import { getNextNumericId } from "../utils/getNextNumericId";

export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [sort, setSort] = useState("");
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const brandsData = await getCollection("brands");
    const productsData = await getCollection("products");

    setBrands(brandsData);
    setProducts(productsData);
  };

  const productCountByBrand = useMemo(() => {
    return products.reduce((acc, product) => {
      acc[String(product.brandId)] = (acc[String(product.brandId)] || 0) + 1;
      return acc;
    }, {});
  }, [products]);

  const sortedBrands = [...brands]
    .filter((brand) =>
      brand.name.toLowerCase().includes(keyword.trim().toLowerCase()),
    )
    .sort((a, b) => {
      const countA = productCountByBrand[a.id] || 0;
      const countB = productCountByBrand[b.id] || 0;

      if (sort === "productDesc") return countB - countA;
      if (sort === "productAsc") return countA - countB;
      return a.id - b.id;
    });
  const handleAddBrand = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (trimmedName === "") {
      alert("Tên thương hiệu không được để trống!");
      return;
    }

    const isDuplicate = brands.some(
      (b) => b.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      alert("Tên thương hiệu đã tồn tại trong hệ thống!");
      return;
    }

    const createdBrand = await createItem("brands", {
      id: getNextNumericId(brands),
      name: trimmedName,
      status: "ACTIVE",
    });

    setBrands([...brands, createdBrand]);
    setName("");
    setShowForm(false);

    alert("Thêm thương hiệu thành công!");
  };

  const handleEditName = async (brand) => {
    const newName = window.prompt("Nhập tên thương hiệu mới:", brand.name);

    if (newName === null) return;

    const trimmedNewName = newName.trim();

    if (trimmedNewName === "") {
      alert("Tên thương hiệu không được để trống!");
      return;
    }

    if (trimmedNewName === brand.name) return;

    const isDuplicate = brands.some(
      (b) => b.id !== brand.id && b.name.trim().toLowerCase() === trimmedNewName.toLowerCase()
    );

    if (isDuplicate) {
      alert("Tên thương hiệu này đã tồn tại trong hệ thống!");
      return;
    }

    const updatedBrand = await updateItem("brands", brand.id, {
      name: trimmedNewName,
    });

    setBrands(
      brands.map((item) =>
        item.id === brand.id ? { ...item, ...updatedBrand } : item,
      ),
    );

    alert("Cập nhật tên thương hiệu thành công!");
  };

  const handleToggleStatus = async (brand) => {
    const nextStatus = brand.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";

    const updatedBrand = await updateItem("brands", brand.id, {
      status: nextStatus,
    });

    setBrands(
      brands.map((item) =>
        item.id === brand.id ? { ...item, ...updatedBrand } : item,
      ),
    );
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
        }}
      >
        <h2>Quản Lý Thương Hiệu</h2>

        <div>
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
              marginRight: "12px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontWeight: "bold",
            }}
          >
            <option value="">Sắp xếp mặc định</option>
            <option value="productDesc">Nhiều mặt hàng nhất</option>
            <option value="productAsc">Ít mặt hàng nhất</option>
          </select>

          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-submit"
            style={{ width: "auto", padding: "10px 20px" }}
          >
            {showForm ? "Đóng Form" : "+ Thêm Thương Hiệu"}
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
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            display: "flex",
            gap: "12px",
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên thương hiệu"
            style={{
              flex: 1,
              height: "42px",
              padding: "0 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
            }}
          />

          <button
            type="submit"
            className="btn-submit"
            style={{ width: "180px" }}
          >
            Lưu
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
            <th>Tên thương hiệu</th>
            <th>Số sản phẩm</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {sortedBrands.map((brand) => (
            <tr key={brand.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "15px", fontWeight: "bold" }}>
                {brand.id}
              </td>

              <td style={{ fontWeight: "600" }}>{brand.name}</td>

              <td>
                <span
                  style={{
                    padding: "4px 10px",
                    background: "#e7f1ff",
                    color: "#0d6efd",
                    borderRadius: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {productCountByBrand[brand.id] || 0}
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
                      brand.status === "INACTIVE" ? "#f8d7da" : "#d4edda",
                    color: brand.status === "INACTIVE" ? "#721c24" : "#155724",
                  }}
                >
                  {brand.status === "INACTIVE"
                    ? "Vô hiệu hóa"
                    : "Đang hoạt động"}
                </span>
              </td>

              <td>
                <button
                  onClick={() => handleEditName(brand)}
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
                  onClick={() => handleToggleStatus(brand)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor:
                      brand.status === "INACTIVE" ? "#28a745" : "#dc3545",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    minWidth: "110px",
                  }}
                >
                  {brand.status === "INACTIVE" ? "Kích hoạt" : "Vô hiệu hóa"}
                </button>
              </td>
            </tr>
          ))}

          {sortedBrands.length === 0 && (
            <tr>
              <td colSpan="5" style={{ padding: "20px", textAlign: "center" }}>
                Chưa có thương hiệu nào.
              </td>
            </tr>
          )}
          
        </tbody>
      </table>
    </div>
  );
}
