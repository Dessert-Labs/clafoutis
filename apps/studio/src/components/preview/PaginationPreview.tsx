interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationPreview({
  currentPage,
  totalPages,
  onPageChange,
}: Readonly<PaginationProps>) {
  const safeTotal = Math.max(1, Number(totalPages) || 0);
  const safePage = Math.max(1, Math.min(safeTotal, Number(currentPage) || 0));
  const pages = Array.from({ length: safeTotal }, (_, i) => i + 1);

  return (
    <nav className="flex items-center gap-1">
      <button
        className="rounded-md border px-3 py-1.5 text-sm transition-colors"
        style={{
          borderColor: "rgb(var(--colors-pagination-item-border))",
          color:
            safePage === 1
              ? "rgb(var(--colors-pagination-item-disabled-text))"
              : "rgb(var(--colors-pagination-item-text))",
          cursor: safePage === 1 ? "not-allowed" : "pointer",
        }}
        disabled={safePage === 1}
        onClick={() => onPageChange(safePage - 1)}
      >
        Prev
      </button>

      {pages.map((page) => (
        <button
          key={page}
          className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          style={{
            backgroundColor:
              page === safePage
                ? "rgb(var(--colors-pagination-active-bg))"
                : "rgb(var(--colors-pagination-item-bg))",
            color:
              page === safePage
                ? "rgb(var(--colors-pagination-active-text))"
                : "rgb(var(--colors-pagination-item-text))",
          }}
          onMouseEnter={(e) => {
            if (page !== safePage) {
              e.currentTarget.style.backgroundColor =
                "rgb(var(--colors-pagination-item-hover))";
            }
          }}
          onMouseLeave={(e) => {
            if (page !== safePage) {
              e.currentTarget.style.backgroundColor =
                "rgb(var(--colors-pagination-item-bg))";
            }
          }}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        className="rounded-md border px-3 py-1.5 text-sm transition-colors"
        style={{
          borderColor: "rgb(var(--colors-pagination-item-border))",
          color:
            safePage === safeTotal
              ? "rgb(var(--colors-pagination-item-disabled-text))"
              : "rgb(var(--colors-pagination-item-text))",
          cursor: safePage === safeTotal ? "not-allowed" : "pointer",
        }}
        disabled={safePage === safeTotal}
        onClick={() => onPageChange(safePage + 1)}
      >
        Next
      </button>
    </nav>
  );
}
