"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface PaginationProps {
  page: number;
  count: number;
  itemsPerPage?: number;
}

const Pagination = ({ page, count, itemsPerPage = 10 }: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(count / itemsPerPage);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update page number
    params.set("page", newPage.toString());
    
    // Preserve items per page if set
    if (itemsPerPage) {
      params.set("perPage", itemsPerPage.toString());
    }
    
    // Preserve all other existing parameters (sort, direction, search, etc.)
    router.push(`?${params.toString()}`);
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (page <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (page >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  return (
    <div className="flex items-center justify-between mt-6">
      <motion.button
        whileHover={{ scale: hasPrev ? 1.05 : 1 }}
        whileTap={{ scale: hasPrev ? 0.95 : 1 }}
        disabled={!hasPrev}
        className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          hasPrev
            ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
        onClick={() => changePage(page - 1)}
      >
        <FiChevronLeft className="w-4 h-4" />
        Previous
      </motion.button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((pageNumber, index) => (
          <div key={index} className="flex items-center justify-center">
            {pageNumber === "..." ? (
              <span className="px-3 py-1 text-gray-400">...</span>
            ) : (
              <motion.button
                whileHover={{ scale: page === pageNumber ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  page === pageNumber
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => changePage(Number(pageNumber))}
              >
                {pageNumber}
              </motion.button>
            )}
          </div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: hasNext ? 1.05 : 1 }}
        whileTap={{ scale: hasNext ? 0.95 : 1 }}
        disabled={!hasNext}
        className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          hasNext
            ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
        onClick={() => changePage(page + 1)}
      >
        Next
        <FiChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
};

export default Pagination;