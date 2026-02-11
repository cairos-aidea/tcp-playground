import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, SquarePen, SquareX } from "lucide-react";

const DepartmentsTable = ({
  departments,
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

  const getSortedDepts = () => {
    if (!sortConfig.key) return departments;
    return [...departments].sort((a, b) => {
      let aValue, bValue;
      switch (sortConfig.key) {
        case "name":
          aValue = a.name || "";
          bValue = b.name || "";
          break;
        case "subsidiary_id":
          aValue = a.subsidiary_id || "";
          bValue = b.subsidiary_id || "";
          break;
        case "department_head_id":
          aValue = a.department_head_id || "";
          bValue = b.department_head_id || "";
          break;
      }
      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  };

  const sortedDepts = useMemo(getSortedDepts, [departments, sortConfig]);

  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronDown className="sort-icon" size={14} />;
    }
    return sortConfig.direction === 'ascending'
      ? <ChevronUp className="sort-icon active" size={14} />
      : <ChevronDown className="sort-icon active" size={14} />;
  };

  const getSubsidiaryName = (id) => {
    const sub = subsidiaries?.find(s => String(s.id) === String(id));
    return sub ? sub.name : "";
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
              <div className="flex items-center">Department Name{renderSortIndicator("name")}</div>
            </th>
            <th className="px-4 py-3 text-primary cursor-pointer" onClick={() => requestSort("subsidiary_id")}>
              <div className="flex items-center">Subsidiary{renderSortIndicator("subsidiary_id")}</div>
            </th>
            <th className="px-4 py-3 text-primary cursor-pointer" onClick={() => requestSort("department_head_id")}>
              <div className="flex items-center">Department Head{renderSortIndicator("department_head_id")}</div>
            </th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedDepts.map((dept, idx) => {
            const staff = staffs?.find(u => String(u.id) === String(dept.department_head_id));
            const initials = `${staff?.first_name?.[0]?.toUpperCase() || ''}${staff?.last_name?.[0]?.toUpperCase() || ''}`;

            return (
              <tr key={dept.id} className={`hover:bg-gray-100 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'} transition`}>
                <td className="px-4 py-2">{dept.name}</td>
                <td className="px-4 py-2">{getSubsidiaryName(dept.subsidiary_id)}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center">
                    {staff && staff.profile ? (
                      <img className="w-7 h-7 rounded-full" src={`data:image/png;base64,${staff.profile}`} alt="User" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-950 font-bold text-xs">{initials}</span>
                      </div>
                    )}
                    <div className="ps-3">{getStaffName(dept.department_head_id) ? getStaffName(dept.department_head_id) : <span className="italic text-gray-500">No department head</span>}</div>
                  </div>
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    className="text-primary hover:text-primary/80"
                    onClick={() => onEdit(dept)}
                    title="Edit"
                  >
                    <SquarePen size={18} />
                  </button>
                  <button
                    className="text-muted hover:text-muted"
                    onClick={() => onDelete(dept.id)}
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

export default DepartmentsTable;
