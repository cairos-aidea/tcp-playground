import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, SquarePen, SquareX } from "lucide-react";

const SubsidiariesTable = ({
  subsidiaries,
  staffs,
  onEdit,
  onDelete,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "ascending" ? "descending" : "ascending" };
      }
      return { key, direction: "ascending" };
    });
  };

  const getSortedSubs = () => {
    if (!sortConfig.key) return subsidiaries;
    return [...subsidiaries].sort((a, b) => {
      let aValue, bValue;
      switch (sortConfig.key) {
        case "name":
          aValue = a.name || "";
          bValue = b.name || "";
          break;
        case "manager_id":
          aValue = a.manager_id || "";
          bValue = b.manager_id || "";
          break;
      }
      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  };

  const sortedSubs = useMemo(getSortedSubs, [subsidiaries, sortConfig]);

  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronDown className="sort-icon" size={14} />;
    }
    return sortConfig.direction === 'ascending'
      ? <ChevronUp className="sort-icon active" size={14} />
      : <ChevronDown className="sort-icon active" size={14} />;
  };

  const getStaffName = (id) => {
    const staff = staffs?.find(u => String(u.id) === String(id));
    return staff ? `${staff.first_name} ${staff.last_name}` : "";
  };

  return (
    <div className="overflow-x-auto bg-white">
      <table className="table-auto w-full text-sm text-left text-gray-900">
        <thead className="bg-gray-100 sticky top-0 z-10 text-sm font-bold h-12">
          <tr>
            <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("name")}> 
              <div className="flex items-center">Subsidiary Name{renderSortIndicator("name")}</div>
            </th>
            <th className="px-4 py-3 text-primary cursor-pointer" onClick={() => requestSort("manager_id")}> 
              <div className="flex items-center">Subsidiary Head{renderSortIndicator("manager_id")}</div>
            </th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedSubs.map((sub, idx) => {
            const staff = staffs?.find(u => String(u.id) === String(sub.manager_id));
            const initials = `${staff?.first_name?.[0]?.toUpperCase() || ''}${staff?.last_name?.[0]?.toUpperCase() || ''}`;

            return (
              <tr key={sub.id} className={`hover:bg-gray-100 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'} transition`}>
                <td className="px-4 py-2">{sub.name}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center">
                    {staff && staff.profile ? (
                      <img className="w-7 h-7 rounded-full" src={`data:image/png;base64,${staff.profile}`} alt="User" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-950 font-bold text-xs">{initials}</span>
                      </div>
                    )}
                    <div className="ps-3">{getStaffName(sub.manager_id) ? getStaffName(sub.manager_id) : <span className="italic text-gray-500">No subsidiary head</span>}</div>
                  </div>
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    className="text-primary hover:text-primary/80"
                    onClick={() => onEdit(sub)}
                    title="Edit"
                  >
                    <SquarePen size={18} />
                  </button>
                  <button
                    className="text-muted hover:text-muted"
                    onClick={() => onDelete(sub.id)}
                    title="Delete"
                  >
                    <SquareX size={18} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SubsidiariesTable;
