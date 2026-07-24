export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.total_pages <= 1) return null;

  const { page, total_pages, has_next, has_prev, total } = pagination;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (total_pages <= maxVisible) {
      for (let i = 1; i <= total_pages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(total_pages - 1, page + 1);

      if (page <= 2) {
        start = 2;
        end = Math.min(4, total_pages - 1);
      } else if (page >= total_pages - 1) {
        start = Math.max(2, total_pages - 3);
        end = total_pages - 1;
      }

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < total_pages - 1) pages.push("...");
      pages.push(total_pages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <p className="text-sm text-slate-500">
        Showing page {page} of {total_pages} ({total} products)
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!has_prev}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          Prev
        </button>

        {getPageNumbers().map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[36px] px-3 py-1.5 text-sm rounded-lg border transition cursor-pointer ${
                p === page
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!has_next}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
}
