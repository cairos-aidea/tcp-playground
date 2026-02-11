import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

const Pagination = ({
  currentPage,
  lastPage,
  totalPages,
  totalRecords,
  onPageChange
}) => {

  const getPageRange = () => {
    // Show up to 5 pages, centered on currentPage
    const delta = 2;
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, currentPage + delta);

    if (currentPage <= delta) {
      end = Math.min(totalPages, 1 + 2 * delta);
    }
    if (currentPage + delta > totalPages) {
      start = Math.max(1, totalPages - 2 * delta);
    }
    return [start, end];
  };

  const generatePages = () => {
    const pages = [];
    const [startPage, endPage] = getPageRange();

    // First page button
    pages.push(
      <button
        key="first"
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        onClick={() => onPageChange(1)}
        aria-label="First page"
        disabled={currentPage === 1}
      >
        <ChevronsLeft size={16} />
      </button>
    );

    // Prev page button
    pages.push(
      <button
        key="prev"
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} />
      </button>
    );

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-300 ${currentPage === i
            ? 'bg-gray-300 text-gray-950 font-semibold cursor-default'
            : 'text-gray-700'
            }`}
          onClick={() => currentPage !== i && onPageChange(i)}
          disabled={currentPage === i}
        >
          {i}
        </button>
      );
    }

    // Next page button
    pages.push(
      <button
        key="next"
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
        disabled={currentPage === lastPage}
      >
        <ChevronRight size={16} />
      </button>
    );

    // Last page button
    pages.push(
      <button
        key="last"
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        onClick={() => onPageChange(lastPage)}
        aria-label="Last page"
        disabled={currentPage === lastPage}
      >
        <ChevronsRight size={16} />
      </button>
    );

    return pages;
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <div className="pagination-controls flex space-x-2">
          {generatePages()}
        </div>
      </div>
      <div className="text-sm font-semibold ml-5">
        Total Records: <strong>{totalRecords}</strong>
      </div>
    </div>
  );
};

export default Pagination;

