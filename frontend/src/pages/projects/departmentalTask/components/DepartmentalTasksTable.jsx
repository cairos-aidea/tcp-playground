import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, SquarePen, SquareX } from "lucide-react";

const DepartmentalTasksTable = ({
    departmentalTasks,
    departments,
    getSubsidiaryName,
    handleEdit,
    handleDelete,
    setConfirmDeleteId,
    confirmDeleteId,
    auth_user, // <-- Make sure this is passed as a prop
}) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    const getDepartmentName = (department_id) => {
        const dept = departments?.find(d => d.id === department_id);
        return dept ? dept.name : "Unknown";
    };

    const requestSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return { key, direction: prev.direction === "ascending" ? "descending" : "ascending" };
            }
            return { key, direction: "ascending" };
        });
    };

    const getSortedTasks = () => {
        if (!sortConfig.key) return departmentalTasks;
        return [...departmentalTasks].sort((a, b) => {
            let aValue, bValue;
            switch (sortConfig.key) {
                case "task_name":
                    aValue = a.task_name || "";
                    bValue = b.task_name || "";
                    break;
                case "subsidiary":
                    aValue = getSubsidiaryName(a.department_id) || "";
                    bValue = getSubsidiaryName(b.department_id) || "";
                    break;
                case "department_name":
                    aValue = getDepartmentName(a.department_id) || "";
                    bValue = getDepartmentName(b.department_id) || "";
                    break;
                default:
                    return 0;
            }
            if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
            return 0;
        });
    };

    const sortedTasks = useMemo(getSortedTasks, [departmentalTasks, sortConfig, departments]);

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
            <table className="table-auto w-full text-sm text-left text-gray-900 border">
                <thead className="bg-gray-100 sticky top-0 z-10 text-sm font-bold h-12">
                    <tr>
                        <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("task_name")}>
                            <div className="flex items-center">Task Name{renderSortIndicator("task_name")}</div>
                        </th>
                        <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("subsidiary")}>
                            <div className="flex items-center">Subsidiary{renderSortIndicator("subsidiary")}</div>
                        </th>
                        <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("department_name")}>
                            <div className="flex items-center">Department{renderSortIndicator("department_name")}</div>
                        </th>
                        {auth_user?.role_id === 3 && (
                            <th className="px-4 py-3">Actions</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {sortedTasks.map((record, idx) => (
                        <tr key={record.id} className={`hover:bg-gray-100 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'} transition`}>
                            <td className="px-4 py-2">{record.task_name}</td>
                            <td className="px-4 py-2">{getSubsidiaryName(record.department_id)}</td>
                            <td className="px-4 py-2">{getDepartmentName(record.department_id)}</td>
                            {auth_user?.role_id === 3 && (
                                <td className="px-4 py-2 flex gap-2">
                                    <button
                                        className="text-primary hover:text-primary/80"
                                        onClick={() => handleEdit(record)}
                                        title="Edit"
                                    >
                                        <SquarePen size={18} />
                                    </button>
                                    <button
                                        className="text-muted hover:text-muted"
                                        onClick={() => handleDelete(record.id)}
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

export default DepartmentalTasksTable;
