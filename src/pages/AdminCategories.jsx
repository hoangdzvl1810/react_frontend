import { useEffect, useMemo, useState } from "react";
import { createItem, getCollection, updateItem } from "../services/api";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [sort, setSort] = useState("");
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const categoriesData = await getCollection("categories");
    const productsData = await getCollection("products");

    setCategories(categoriesData);
    setProducts(productsData);
  };

  const productCountByCategory = useMemo(() => {
    return products.reduce((acc, product) => {
      acc[String(product.categoryId)] = (acc[String(product.categoryId)] || 0) + 1;
      return acc;
    }, {});
  }, [products]);

  const sortedCategories = [...categories]
    .filter((category) =>
      category.name.toLowerCase().includes(keyword.trim().toLowerCase()),
    )
    .sort((a, b) => {
      const countA = productCountByCategory[a.id] || 0;
      const countB = productCountByCategory[b.id] || 0;

      if (sort === "productAsc") return countA - countB;
      if (sort === "productDesc") return countB - countA;

      return a.id - b.id;
    });

  const handleAddCategory = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (trimmedName === "") {
      alert("Tên danh mục không được để trống!");
      return;
    }

    const isDuplicate = categories.some(
      (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      alert("Tên danh mục đã tồn tại trong hệ thống!");
      return;
    }

    const createdCategory = await createItem("categories", {
      name: trimmedName,
      status: "ACTIVE",
    });

    setCategories([...categories, createdCategory]);
    setName("");
    setShowForm(false);

    alert("Thêm danh mục thành công!");
  };

  const handleEditName = async (category) => {
    const newName = window.prompt("Nhập tên danh mục mới:", category.name);

    if (newName === null) return;

    const trimmedNewName = newName.trim();

    if (trimmedNewName === "") {
      alert("Tên danh mục không được để trống!");
      return;
    }

    if (trimmedNewName === category.name) return;

    const isDuplicate = categories.some(
      (c) => c.id !== category.id && c.name.trim().toLowerCase() === trimmedNewName.toLowerCase()
    );

    if (isDuplicate) {
      alert("Tên danh mục này đã tồn tại trong hệ thống!");
      return;
    }

    const updatedCategory = await updateItem("categories", category.id, {
      name: trimmedNewName,
    });

    setCategories(
      categories.map((item) =>
        item.id === category.id ? { ...item, ...updatedCategory } : item,
      ),
    );

    alert("Cập nhật tên danh mục thành công!");
  };

  const handleToggleStatus = async (category) => {
    const nextStatus = category.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";

    const updatedCategory = await updateItem("categories", category.id, {
      status: nextStatus,
    });

    setCategories(
      categories.map((item) =>
        item.id === category.id ? { ...item, ...updatedCategory } : item,
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
        <h2>Quản Lý Danh Mục</h2>

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
            {showForm ? "Đóng Form" : "+ Thêm Danh Mục"}
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
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            display: "flex",
            gap: "12px",
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên danh mục"
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
            style={{ width: "160px" }}
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
            <th>Tên danh mục</th>
            <th>Số sản phẩm</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {sortedCategories.map((category) => (
            <tr key={category.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "15px", fontWeight: "bold" }}>
                {category.id}
              </td>

              <td style={{ fontWeight: "600" }}>{category.name}</td>

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
                  {productCountByCategory[category.id] || 0}
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
                      category.status === "INACTIVE" ? "#f8d7da" : "#d4edda",
                    color:
                      category.status === "INACTIVE" ? "#721c24" : "#155724",
                  }}
                >
                  {category.status === "INACTIVE"
                    ? "Vô hiệu hóa"
                    : "Đang hoạt động"}
                </span>
              </td>

              <td>
                <button
                  onClick={() => handleEditName(category)}
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
                  onClick={() => handleToggleStatus(category)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor:
                      category.status === "INACTIVE" ? "#28a745" : "#dc3545",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    minWidth: "110px",
                  }}
                >
                  {category.status === "INACTIVE" ? "Kích hoạt" : "Vô hiệu hóa"}
                </button>
              </td>
            </tr>
          ))}

          {sortedCategories.length === 0 && (
            <tr>
              <td colSpan="5" style={{ padding: "20px", textAlign: "center" }}>
                Chưa có danh mục nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
