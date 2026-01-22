import React from "react";

interface CustomPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function CustomPagination({
    currentPage,
    totalPages,
    onPageChange,
    className = "",
}: CustomPaginationProps) {
    if (totalPages <= 1) return null;

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5; // Maximum visible page numbers

        if (totalPages <= maxVisible) {
            // Show all pages if total is less than maxVisible
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage <= 3) {
                // Near the start
                for (let i = 2; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push("...");
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                // Near the end
                pages.push("...");
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // In the middle
                pages.push("...");
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push("...");
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className={`flex justify-center gap-2 items-center w-full ${className}`}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${currentPage === 1
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#0870B4] hover:border-[#0870B4]"
                    }`}
                aria-label="Previous Page"
            >
                &lt;
            </button>

            {getPageNumbers().map((page, index) => {
                if (page === "...") {
                    return (
                        <span
                            key={`ellipsis-${index}`}
                            className="w-10 h-10 flex items-center justify-center text-gray-400"
                        >
                            ...
                        </span>
                    );
                }

                const pageNum = page as number;
                const isActive = pageNum === currentPage;

                return (
                    <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors font-medium ${isActive
                            ? "bg-[#0870B4] text-white border-[#0870B4] shadow-md"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#0870B4] hover:border-[#0870B4]"
                            }`}
                        aria-label={`Page ${pageNum}`}
                        aria-current={isActive ? "page" : undefined}
                    >
                        {pageNum}
                    </button>
                );
            })}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${currentPage === totalPages
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#0870B4] hover:border-[#0870B4]"
                    }`}
                aria-label="Next Page"
            >
                &gt;
            </button>
        </div>
    );
}
