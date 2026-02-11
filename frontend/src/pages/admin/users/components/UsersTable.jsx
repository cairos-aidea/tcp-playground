import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import Tooltip from "../../../../components/layouts/Tooltip";

// Example role mapping
const ROLE_LABELS = {
  1: "Employee",
  2: "Manager",
  3: "Admin",
};

const UsersTable = ({
  users,
  setUsers,
  subsidiaries,
  departments,
  getSubsidiaryName,
  getDepartmentName,
  getDepartmentsBySubsidiary,
  editingCell,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel

}) => {

  // Sorting logic
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [tooltipUserId, setTooltipUserId] = useState(null);

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "ascending" ? "descending" : "ascending" };
      }
      return { key, direction: "ascending" };
    });
  };

  const getSortedUsers = () => {
    if (!sortConfig.key) return users;
    return [...users].sort((a, b) => {
      let aValue, bValue;
      switch (sortConfig.key) {
        case "email":
          aValue = a.email || "";
          bValue = b.email || "";
          break;
        case "first_name":
          aValue = a.first_name || "";
          bValue = b.first_name || "";
          break;
        case "last_name":
          aValue = a.last_name || "";
          bValue = b.last_name || "";
          break;
        // case "job_title":
        //   aValue = a.job_title || "";
        //   bValue = b.job_title || "";
        //   break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "employee_id":
          aValue = a.employee_id || "";
          bValue = b.employee_id || "";
          break;
        case "rank":
          aValue = a.rank || "";
          bValue = b.rank || "";
          break;
        case "subsidiary":
          aValue = getSubsidiaryName(a.subsidiary_id) || "";
          bValue = getSubsidiaryName(b.subsidiary_id) || "";
          break;
        case "department":
          aValue = getDepartmentName(a.department_id) || "";
          bValue = getDepartmentName(b.department_id) || "";
          break;
        case "role_id":
          aValue = a.role_id || 0;
          bValue = b.role_id || 0;
          break;
        case "sex":
          aValue = a.sex || "";
          bValue = b.sex || "";
          break;
        case "is_active":
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        case "hire_date":
          aValue = new Date(a.hire_date) || new Date(0);
          bValue = new Date(b.hire_date) || new Date(0);
          break;
        default:
          aValue = a[sortConfig.key] || "";
          bValue = b[sortConfig.key] || "";
      }
      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  };

  const sortedUsers = useMemo(getSortedUsers, [users, sortConfig]);

  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronDown className="sort-icon" size={14} />;
    }
    return sortConfig.direction === 'ascending'
      ? <ChevronUp className="sort-icon active" size={14} />
      : <ChevronDown className="sort-icon active" size={14} />;
  };

  return (
    <div className="overflow-x-auto bg-white">
      <table className="table-auto w-full text-sm text-left text-gray-900">
        <thead className="bg-gray-100 sticky top-0 z-10 text-sm font-bold h-12">
          <tr>
            <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("email")}>
              <div className="flex items-center">User{renderSortIndicator("email")}</div>
            </th>
            {/* <th className="px-4 py-3 text-primary cursor-pointer" onClick={() => requestSort("job_title")}>
              <div className="flex items-center">Job Title{renderSortIndicator("job_title")}</div>
            </th> */}
            <th className="px-4 py-3 text-primary cursor-pointer" onClick={() => requestSort("role_id")}>
              <div className="flex items-center">Role{renderSortIndicator("role_id")}</div>
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("status")}>
              <div className="flex items-center">Status{renderSortIndicator("status")}</div>
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("sex")}>
              <div className="flex items-center">Sex{renderSortIndicator("sex")}</div>
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("employee_id")}>
              <div className="flex items-center">Employee ID{renderSortIndicator("employee_id")}</div>
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("rank")}>
              <div className="flex items-center">Rank{renderSortIndicator("rank")}</div>
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("subsidiary")}>
              <div className="flex items-center">Subsidiary{renderSortIndicator("subsidiary")}</div>
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("department")}>
              <div className="flex items-center">Department{renderSortIndicator("department")}</div>
            </th>
            {/* <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("is_active")}>
              <div className="flex items-center">Status{renderSortIndicator("is_active")}</div>
            </th> */}
            <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("hire_date")}>
              <div className="flex items-center">Hire Date{renderSortIndicator("hire_date")}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user, idx) => {
            const isEditing = (field) =>
              editingCell.userId === user.id && editingCell.field === field;
            const initials = `${user?.first_name?.[0]?.toUpperCase() || ''}${user?.last_name?.[0]?.toUpperCase() || ''}`;
            const isInactive = user.is_active === "no";
            return (
              <tr key={user.id} className={`hover:bg-gray-100 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'} transition`}>
                <td className="px-4 py-2">
                  <div className="flex items-center">
                    <div className="relative w-10 h-10"
                      onMouseEnter={() => setTooltipUserId(user.id)}
                      onMouseLeave={() => setTooltipUserId(null)}>
                      {user?.profile ? (

                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <img
                            className="w-10 h-10 rounded-full"
                            src={`data:image/png;base64,${user.profile}`}
                            alt="User"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-950 font-bold text-lg">{initials}</span>
                        </div>
                      )}

                    </div>

                    <div className="ps-3">
                      <div className="font-semibold leading-tight">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>

                {/* <td className="px-4 py-2">
                  {editingCell.userId === user.id && editingCell.field === "job_title" ? (
                    <input
                      className="px-2 py-1 border-2 border-primary rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      value={user.job_title}
                      autoFocus
                      onChange={(e) => onEditChange(user.id, "job_title", e.target.value)}
                      onBlur={() => onEditSave(user.id, "job_title")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onEditSave(user.id, "job_title");
                        if (e.key === "Escape") onEditCancel();
                      }}
                      disabled={isInactive}
                    />
                  ) : (
                    <span
                      className="cursor-pointer bg-primary/10 px-2 py-1 rounded-full text-primary font-semibold hover:bg-primary/20 transition"
                      tabIndex={0}
                      onClick={() => onEditStart(user, "job_title")}
                      onKeyDown={() => {
                        onEditStart(user, "job_title");
                      }}
                      onMouseEnter={() => setTooltipUserId(`job_title_${user.id}`)}
                      onMouseLeave={() => setTooltipUserId(null)}
                      style={{ position: "relative" }}
                    >
                      {user.job_title || <span className="text-gray-400">-</span>}
                      {!isInactive && (
                        <Tooltip content={`Edit ${user.first_name}'s job title`} visible={tooltipUserId === `job_title_${user.id}`} />
                      )}
                    </span>
                  )}
                </td> */}
                <td className="px-4 py-2">
                  {isEditing("role_id") ? (
                    <select
                      className="px-2 py-1 border-2 border-primary rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      value={user.role_id}
                      autoFocus
                      onChange={(e) => onEditChange(user.id, "role_id", e.target.value)}
                      onBlur={() => onEditSave(user.id, "role_id")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onEditSave(user.id, "role_id");
                        if (e.key === "Escape") onEditCancel();
                      }}
                      disabled={isInactive}
                    >
                      <option value="" disabled>Select</option>
                      <option value="1">Employee</option>
                      <option value="2">Manager</option>
                      <option value="3">Admin</option>
                    </select>
                  ) : (
                    <span
                      className="cursor-pointer bg-primary/10 px-2 py-1 rounded-full text-primary font-semibold hover:bg-primary/20 transition"
                      tabIndex={0}
                      onClick={() => onEditStart(user, "role_id")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") onEditStart(user, "role_id");
                      }}
                      onMouseEnter={() => setTooltipUserId(`role_${user.id}`)}
                      onMouseLeave={() => setTooltipUserId(null)}
                      style={{ position: "relative" }}
                    >
                      {ROLE_LABELS[user.role_id] || <span className="text-gray-400">-</span>}
                      {!isInactive && (
                        <Tooltip content={`Edit ${user.first_name}'s role`} visible={tooltipUserId === `role_${user.id}`} />
                      )}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">{user.status}</td>
                <td className="px-4 py-2 uppercase">{user.sex}</td>
                <td className="px-4 py-2">{user.employee_id}</td>
                <td className="px-4 py-2">{user.rank}</td>
                <td className="px-4 py-2">{getSubsidiaryName(user.subsidiary_id)}</td>
                <td className="px-4 py-2">{getDepartmentName(user.department_id)}</td>
                {/* <td className="px-4 py-2">{user.is_active === "yes" ? "Active" : "Inactive"}</td> */}
                <td className="px-4 py-2">{user.hire_date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;
