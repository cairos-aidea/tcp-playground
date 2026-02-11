import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

const Pagination = ({
  currentPage,
  lastPage,
  totalRecords,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  const generatePages = () => {
    const pages = [];

    const maxVisible = 10;
    let startPage = Math.max(1, currentPage - 4);
    let endPage = Math.min(lastPage, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // First & Prev buttons
    pages.push(
      <button
        key="first"
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-300 disabled:opacity-50"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="First page"
      >
        <ChevronsLeft size={16} />
      </button>,
      <button
        key="prev"
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-300 disabled:opacity-50"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
    );

    // Page number buttons
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

    // Next & Last buttons
    pages.push(
      <button
        key="next"
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-300 disabled:opacity-50"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>,
      <button
        key="last"
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-300 disabled:opacity-50"
        onClick={() => onPageChange(lastPage)}
        disabled={currentPage === lastPage}
        aria-label="Last page"
      >
        <ChevronsRight size={16} />
      </button>
    );

    return pages;
  };

  const currentTotalShown = Math.min(currentPage * itemsPerPage, totalRecords);
  const recordText = `${currentTotalShown} out of ${totalRecords} records`;

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">        
        <div className="pagination-controls flex flex-wrap gap-2">
          {generatePages()}
        </div>

        <div className="ml-2">
          <label className="text-sm font-medium">Items per page: </label>
          <select className="border border-gray-300 rounded-md px-2 py-1 text-sm" value={itemsPerPage} onChange={(e) => onItemsPerPageChange(Number(e.target.value))}>
            {[25, 50, 75, 100, 250].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm font-semibold text-gray-700 ">
          {recordText}
        </div>
      </div>
    </div>
  );
};

export default Pagination;
