import React, { useEffect, useState, useMemo } from "react";
import { useAppData } from '../../../context/AppDataContext';
import { api } from "../../../api/api";
import Search from "../../../components/navigations/Search";
import Pagination from "../../../components/navigations/Pagination";
import UsersTable from './components/UsersTable';
import ReactLoading from "react-loading";

const Users = () => {
  const {
    isLoading,
    staffs,
    setStaffs,
    subsidiaries,
    departments,
    headerReq
  } = useAppData();

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [editingCell, setEditingCell] = useState({ userId: null, field: null });
  const [newUser, setNewUser] = useState({
    role_id: "",
    email: "",
    first_name: "",
    last_name: "",
    job_title: "",
    status: "",
    employee_id: "",
    rank: "",
    subsidiary_id: "",
    department: "",
    sex: "",
    is_active: "",
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const USERS_PER_PAGE = 25;

  // Helper: Get name from id
  const getSubsidiaryName = (id) => subsidiaries.find((s) => s.id === Number(id))?.name || "";
  const getDepartmentName = (id) => departments.find((d) => d.id === Number(id))?.name || "";

  // Filter departments by subsidiary
  const getDepartmentsBySubsidiary = (subsidiaryId) =>
    departments.filter((d) => String(d.subsidiary_id) === String(subsidiaryId));

  // Sorting and filtering
  const filteredSortedStaffs = useMemo(() => {
    let filtered = staffs.filter(
      (u) =>
        (u.is_active === "yes") && (
          u.first_name.toLowerCase().includes(search.toLowerCase()) ||
          u.last_name.toLowerCase().includes(search.toLowerCase()) ||
          getSubsidiaryName(u.subsidiary_id).toLowerCase().includes(search.toLowerCase()) ||
          getDepartmentName(u.department).toLowerCase().includes(search.toLowerCase())
        )
    );
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key === "subsidiary_id") {
          aValue = getSubsidiaryName(a.subsidiary_id);
          bValue = getSubsidiaryName(b.subsidiary_id);
        } else if (sortConfig.key === "department") {
          aValue = getDepartmentName(a.department);
          bValue = getDepartmentName(b.department);
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [staffs, search, sortConfig, subsidiaries, departments]);

  // Paginated users
  const paginatedStaffs = useMemo(() => {
    const start = (page - 1) * USERS_PER_PAGE;
    return filteredSortedStaffs.slice(start, start + USERS_PER_PAGE);
  }, [filteredSortedStaffs, page]);

  const totalPages = Math.ceil(filteredSortedStaffs.length / USERS_PER_PAGE);

  // Sorting handler
  // const handleSort = (key) => {
  //   setSortConfig((prev) => ({
  //     key,
  //     direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
  //   }));
  // };

  // // Edit handlers (only allow editing job_title and role_id)
  const handleEditChange = (id, field, value) => {
    if (field !== "job_title" && field !== "role_id") return;
    setStaffs((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, [field]: value } : user
      )
    );
  };

  const handleEditSave = async (id, field) => {
    setEditingCell({ userId: null, field: null });
    if (field !== "job_title" && field !== "role_id") return;
    const user = staffs.find((u) => u.id === id);
    if (!user) return;

    // Ensure correct types for integer fields
    const updatedUser = {
      ...user,
      [field]: field === "role_id" ? Number(user[field]) : user[field],
      subsidiary_id: user.subsidiary_id ? Number(user.subsidiary_id) : "",
      department: user.department ? Number(user.department) : "",
      role_id: user.role_id ? Number(user.role_id) : "",
    };


    api("staff_update", { ...headerReq, id }, updatedUser)
      .catch(() => {
        // errorNotification({
        //   title: "Project Update Failed",
        //   message: "Something went wrong. Try again.",
        // });
      }
      );
  };

  // Start editing a cell
  const handleCellEditStart = (user, field) => {
    if (field !== "job_title" && field !== "role_id") return;
    setEditingCell({ userId: user.id, field });
  };

  // Cancel editing a cell
  const handleEditCancel = () => {
    setEditingCell({ userId: null, field: null });
  };

  // // Delete handler (not shown in UI)
  // const handleDelete = async (id) => {
  //   if (!window.confirm("Delete this user?")) return;
  //   setStaffs((prev) => prev.filter((user) => user.id !== id));

  //   api("staff_delete", { ...headerReq, id })
  //     .catch(() => {
  //       errorNotification({
  //         title: "User Deletion Failed",
  //         message: "Something went wrong. Try again.",
  //       });
  //     });
  // };

  // // Add new user
  // const handleNewUserChange = (field, value) => {
  //   setNewUser((prev) => ({
  //     ...prev,
  //     [field]: value,
  //     ...(field === "subsidiary_id" ? { department: "" } : {}),
  //   }));
  // };

  // const handleAddUser = async () => {
  //   const required = [
  //     "first_name",
  //     "last_name",
  //     "job_title",
  //     "status",
  //     "employee_id",
  //     "rank",
  //     "subsidiary_id",
  //     "department",
  //     "role_id",
  //     "sex",
  //     "is_active",
  //   ];
  //   for (let key of required) {
  //     if (!newUser[key]) {
  //       alert("Please fill all fields.");
  //       return;
  //     }
  //   }

  //   // Prepare API payload
  //   const apiPayload = {
  //     ...newUser,
  //     subsidiary_id: Number(newUser.subsidiary_id),
  //     department: Number(newUser.department),
  //     role_id: newUser.role_id ? Number(newUser.role_id) : undefined,
  //   };

  //   api("staff_create", headerReq, apiPayload)
  //     .then((res) => {
  //       setStaffs((prev) => [
  //         ...prev,
  //         { ...newUser, id: res.id },
  //       ]);
  //       setNewUser({
  //         role_id: "",
  //         email: "",
  //         first_name: "",
  //         last_name: "",
  //         job_title: "",
  //         status: "",
  //         employee_id: "",
  //         rank: "",
  //         subsidiary_id: "",
  //         department: "",
  //         sex: "",
  //         is_active: "",
  //       });
  //     })
  //     .catch(() => {
  //       errorNotification({
  //         title: "User Creation Failed",
  //         message: "Something went wrong. Try again.",
  //       });
  //     }
  //     );
  // };

  // // Render cell for editing or display (only job_title and role_id are editable)
  // const renderEditableCell = (user, field, type = "input", options = []) => {
  //   const isEditing = editingCell.userId === user.id && editingCell.field === field;
  //   const editable = field === "job_title" || field === "role_id";
  //   if (isEditing && editable) {
  //     if (type === "select") {
  //       return (
  //         <select
  //           autoFocus
  //           value={user[field] ?? ""}
  //           onChange={(e) => handleEditChange(user.id, field, e.target.value)}
  //           onBlur={() => handleEditSave(user.id, field)}
  //           onKeyDown={(e) => {
  //             if (e.key === "Enter") handleEditSave(user.id, field);
  //             if (e.key === "Escape") handleEditCancel();
  //           }}
  //           className="w-full px-3 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
  //         >
  //           {options}
  //         </select>
  //       );
  //     }

  //     return (
  //       <input
  //         autoFocus
  //         value={user[field] ?? ""}
  //         onChange={(e) => handleEditChange(user.id, field, e.target.value)}
  //         onBlur={() => handleEditSave(user.id, field)}
  //         onKeyDown={(e) => {
  //           if (e.key === "Enter") handleEditSave(user.id, field);
  //           if (e.key === "Escape") handleEditCancel();
  //         }}
  //         className="w-full px-3 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
  //       />
  //     );
  //   }
  //   // Display cell, click to edit if editable
  //   let displayValue = user[field];
  //   if (field === "subsidiary_id") displayValue = getSubsidiaryName(user.subsidiary_id);
  //   if (field === "department") displayValue = getDepartmentName(user.department);
  //   if (editable) {
  //     return (
  //       <span
  //         style={{ cursor: "pointer", background: "#f8f8f8" }}
  //         onClick={() => handleCellEditStart(user, field)}
  //         tabIndex={0}
  //         onKeyDown={(e) => {
  //           if (e.key === "Enter" || e.key === " ") handleCellEditStart(user, field);
  //         }}
  //       >
  //         {displayValue}
  //       </span>
  //     );
  //   }
  //   return <span>{displayValue}</span>;
  // };

  const handlePageChange = (page) => {
    setPage(page);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  useEffect(() => {
    document.title = "Users | Aidea Time Charging";
    setPage(1);
  }, [search, sortConfig]);

  // Count only active users
  const activeStaffCount = staffs.filter((u) => u.is_active === "yes").length;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="container-fluid h-full">
        <div className="w-full sticky top-0 bg-white flex justify-between items-center border-b p-3 z-10">
          <h1 className="text-xl font-semibold text-gray-700">
            Users
          </h1>

          <div className="flex gap-3">
            <Search
              value={search}
              onChange={handleSearchChange}
              placeholder="Search user"
            />
          </div>
        </div>

        <div className="grid grid-cols-12 h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="col-span-12 overflow-x-auto h-full flex flex-col">
            {isLoading ? (
              <div className="flex items-center justify-center h-screen bg-gray-100">
                <ReactLoading type="bars" color="#888888" height={50} width={50} />
              </div>
            ) : (
              <div className="col-span-12 overflow-auto h-full flex flex-col pb-20 sm:pb-4">
                <UsersTable
                  users={paginatedStaffs}
                  setUsers={setStaffs}
                  subsidiaries={subsidiaries}
                  departments={departments} 
                  getSubsidiaryName={getSubsidiaryName}
                  getDepartmentName={getDepartmentName}
                  getDepartmentsBySubsidiary={getDepartmentsBySubsidiary}
                  onEditSave={handleEditSave}
                  onEditStart={handleCellEditStart}
                  onEditChange={handleEditChange}
                  onEditCancel={handleEditCancel}
                  editingCell={editingCell}
                />
              </div>
            )}
          </div>
        </div>

        <div className="w-full sticky bottom-0 bg-white flex justify-center items-center border-t p-3 z-10">
          <Pagination
            currentPage={page}
            lastPage={totalPages}
            totalPages={totalPages}
            totalRecords={activeStaffCount}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Users;