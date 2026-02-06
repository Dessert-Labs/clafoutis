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
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex items-center gap-1">
      <button
        className="rounded-md border px-3 py-1.5 text-sm transition-colors"
        style={{
          borderColor: "rgb(var(--colors-pagination-item-border))",
          color:
            currentPage === 1
              ? "rgb(var(--colors-pagination-item-disabled-text))"
              : "rgb(var(--colors-pagination-item-text))",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
        }}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Prev
      </button>

      {pages.map((page) => (
        <button
          key={page}
          className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          style={{
            backgroundColor:
              page === currentPage
                ? "rgb(var(--colors-pagination-active-bg))"
                : "rgb(var(--colors-pagination-item-bg))",
            color:
              page === currentPage
                ? "rgb(var(--colors-pagination-active-text))"
                : "rgb(var(--colors-pagination-item-text))",
          }}
          onMouseEnter={(e) => {
            if (page !== currentPage) {
              e.currentTarget.style.backgroundColor =
                "rgb(var(--colors-pagination-item-hover))";
            }
          }}
          onMouseLeave={(e) => {
            if (page !== currentPage) {
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
            currentPage === totalPages
              ? "rgb(var(--colors-pagination-item-disabled-text))"
              : "rgb(var(--colors-pagination-item-text))",
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
        }}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </nav>
  );
}
