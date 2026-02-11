import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, SquarePen, SquareX } from "lucide-react";

const ProjectsInternalTable = ({
  projects,
  subsidiaries,
  handleEdit,
  handleDelete,
  auth_user, // <-- Add this prop
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

  const getSortedProjects = () => {
    if (!sortConfig.key) return projects;
    return [...projects].sort((a, b) => {
      let aValue, bValue;
      switch (sortConfig.key) {
        case "project_code":
          aValue = a.project_code || "";
          bValue = b.project_code || "";
          break;
        case "project_name":
          aValue = a.project_name || "";
          bValue = b.project_name || "";
          break;
        case "subsidiary_id":
          aValue = a.subsidiary_id || "";
          bValue = b.subsidiary_id || "";
          break;
        case "project_status":
          aValue = a.project_status || "";
          bValue = b.project_status || "";
          break;
        default:
          return 0;
      }
      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  };

  const sortedProjects = useMemo(getSortedProjects, [projects, sortConfig]);

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
  
  return (
    <div className="overflow-x-auto bg-white">
      <table className="table-auto w-full text-sm text-left text-gray-900">
        <thead className="bg-gray-100 sticky top-0 z-10 text-sm font-bold h-12">
          <tr>
            <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("project_code")}>
              <div className="flex items-center">Project Code{renderSortIndicator("project_code")}</div>
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("project_name")}>
              <div className="flex items-center">Project Name{renderSortIndicator("project_name")}</div>
            </th>
            <th className="px-4 py-3 text-primary cursor-pointer" onClick={() => requestSort("subsidiary_id")}>
              <div className="flex items-center">Subsidiary{renderSortIndicator("subsidiary_id")}</div>
            </th>
            <th className="px-4 py-3 text-primary cursor-pointer" onClick={() => requestSort("project_status")}>
              <div className="flex items-center">Status{renderSortIndicator("project_status")}</div>
            </th>
            {auth_user?.role_id === 3 && (
              <th className="px-4 py-3">Actions</th>
            )}
          </tr>
        </thead>

        <tbody>
          {sortedProjects.map((project, idx) => (
            <tr key={project.id} className={`hover:bg-gray-100 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'} transition`}>
              <td className="px-4 py-2">{project.project_code}</td>
              <td className="px-4 py-2">{project.project_name}</td>
              <td className="px-4 py-2">{getSubsidiaryName(project.subsidiary_id)}</td>
              <td className="px-4 py-2">{project.project_status}</td>
              {auth_user?.role_id === 3 && (
                <td className="px-4 py-2 flex gap-2">
                  <button
                    className="text-primary hover:text-primary/80"
                    onClick={() => handleEdit(project)}
                    title="Edit"
                  >
                    <SquarePen size={18} />
                  </button>
                  <button
                    className="text-muted hover:text-muted"
                    onClick={() => handleDelete(project.id)}
                    title="Delete"
                  >
                    <SquareX size={18} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectsInternalTable;
