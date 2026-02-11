import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, SquarePen, SquareX } from "lucide-react";

const HolidaysTable = ({ holidays = [], onEdit, onDelete, title }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedHolidays = useMemo(() => {
    if (!sortConfig.key) return holidays;
    return [...holidays].sort((a, b) => {
      let aValue = a[sortConfig.key] || "";
      let bValue = b[sortConfig.key] || "";
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [holidays, sortConfig]);

  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronDown className="sort-icon" size={14} />;
    }
    return sortConfig.direction === "asc"
      ? <ChevronUp className="sort-icon active" size={14} />
      : <ChevronDown className="sort-icon active" size={14} />;
  };

  return (
    <div className="overflow-x-auto bg-white">
      {/* <h2 className="text-md p-2 font-semibold text-center">{title}</h2> */}
      <table className="table-auto w-full text-sm text-left text-gray-900 border border-gray-200 rounded-lg">
        <thead className="bg-gray-100 sticky top-0 z-10 text-sm font-bold h-12">
          <tr>
            <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("date")}>
              <div className="flex items-center">Date{renderSortIndicator("date")}</div>
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("holiday_title")}>
              <div className="flex items-center">Title{renderSortIndicator("holiday_title")}</div>
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("holiday_type")}>
              <div className="flex items-center">Type{renderSortIndicator("holiday_type")}</div>
            </th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {holidays.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-4 text-gray-400">
                No holidays found.
              </td>
            </tr>
          ) : (
            sortedHolidays.map((holiday, idx) => (
              <tr
                key={holiday.id}
                className={`hover:bg-gray-100 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'} transition`}
                >
                <td className="px-4 py-2">{holiday.date}</td>
                <td className="px-4 py-2">{holiday.holiday_title}</td>
                <td className="px-4 py-2 capitalize">{holiday.holiday_type}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    className="text-primary hover:text-primary/80"
                    onClick={() => onEdit(holiday)}
                    title="Edit"
                  >
                    <SquarePen size={18} />
                  </button>
                  <button
                    className="text-muted hover:text-muted"
                    onClick={() => onDelete(holiday.id)}
                    title="Delete"
                  >
                    <SquareX size={18} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default HolidaysTable;
