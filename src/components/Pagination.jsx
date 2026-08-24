export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 16,
}) {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginTop: "24px",
        paddingTop: "16px",
        borderTop: "1px solid #e2e8f0",
      }}
    >
      

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: "6px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            background: currentPage === 1 ? "#f1f5f9" : "#ffffff",
            color: currentPage === 1 ? "#94a3b8" : "#334155",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            fontWeight: "500",
            fontSize: "13px",
            transition: "all 0.2s",
          }}
        >
          ‹ Trước
        </button>

        {pages[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              style={{
                padding: "6px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                background: "#ffffff",
                color: "#334155",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "13px",
              }}
            >
              1
            </button>
            {pages[0] > 2 && <span style={{ color: "#94a3b8" }}>...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            style={{
              padding: "6px 12px",
              border: p === currentPage ? "1px solid #2563eb" : "1px solid #cbd5e1",
              borderRadius: "6px",
              background: p === currentPage ? "#2563eb" : "#ffffff",
              color: p === currentPage ? "#ffffff" : "#334155",
              cursor: "pointer",
              fontWeight: p === currentPage ? "700" : "500",
              fontSize: "13px",
              boxShadow: p === currentPage ? "0 2px 6px rgba(37,99,235,0.25)" : "none",
              transition: "all 0.2s",
            }}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span style={{ color: "#94a3b8" }}>...</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              style={{
                padding: "6px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                background: "#ffffff",
                color: "#334155",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "13px",
              }}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            padding: "6px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            background: currentPage >= totalPages ? "#f1f5f9" : "#ffffff",
            color: currentPage >= totalPages ? "#94a3b8" : "#334155",
            cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
            fontWeight: "500",
            fontSize: "13px",
            transition: "all 0.2s",
          }}
        >
          Sau ›
        </button>
      </div>
    </div>
  );
}
