import React, { useState, useMemo, useEffect } from "react";
import { useAppData } from "../../../context/AppDataContext";
import { api } from "../../../api/api";
import { Plus } from 'lucide-react';
import DepartmentsTable from "./components/DepartmentsTable";
import Pagination from "../../../components/navigations/Pagination";
import Search from "../../../components/navigations/Search";
import DepartmentsModal from "./components/DepartmentsModal";
import DepartmentalTasksDeleteModal from "../../projects/departmentalTask/components/DepartmentalTasksDeleteModal";
import { errorNotification, successNotification, pendingNotification } from '../../../components/notifications/notifications';
import ReactLoading from "react-loading";

const Departments = () => {
  const {
    isLoading,
    departments,
    setDepartments,
    staffs,
    subsidiaries,
    headerReq,
  } = useAppData();

  const [selectedSubsidiary, setSelectedSubsidiary] = useState("");
  const [page, setPage] = useState(1);
  const DEPTS_PER_PAGE = 25;

  // Modal state for Add/Edit Department
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [modalDept, setModalDept] = useState(null); // For editing

  // State for delete confirmation modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [departmentIdToDelete, setDepartmentIdToDelete] = useState(null);

  const filteredDepartmentHeads = useMemo(() => {
    return staffs.filter(
      (u) =>
        (selectedSubsidiary === "" || String(u.subsidiary_id) === String(selectedSubsidiary)) &&
        (u.role_id === 2 || u.role_id === 3) && 
        (u.is_active === "yes")
    );
  }, [staffs, selectedSubsidiary]);

  // Helper: Get user name from id
  const getUserName = (id) => {
    const user = staffs.find((u) => u.id === Number(id));
    return user ? `${user.first_name} ${user.last_name}` : "";
  };

  // Helper: Get subsidiary name from id
  const getSubsidiaryName = (id) => {
    const sub = subsidiaries?.find((s) => s.id === Number(id));
    return sub ? sub.name : "";
  };

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // For add/edit modal form state
  const [formDept, setFormDept] = useState({
    name: "",
    department_head_id: "",
    subsidiary_id: "",
  });

  // Filtered and sorted departments
  const filteredDepartments = useMemo(() => {
    let filtered = departments.filter(
      (d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        getUserName(d.department_head_id).toLowerCase().includes(search.toLowerCase()) ||
        getSubsidiaryName(d.subsidiary_id).toLowerCase().includes(search.toLowerCase()) ||
        String(d.id).includes(search)
    );
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key === "department_head_id") {
          aValue = getUserName(a.department_head_id);
          bValue = getUserName(b.department_head_id);
        } else if (sortConfig.key === "subsidiary_id") {
          aValue = getSubsidiaryName(a.subsidiary_id);
          bValue = getSubsidiaryName(b.subsidiary_id);
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
  }, [departments, search, sortConfig, staffs, subsidiaries]);

  // Paginate departments
  const totalPages = Math.ceil(filteredDepartments.length / DEPTS_PER_PAGE);
  const paginatedDepartments = useMemo(() => {
    const start = (page - 1) * DEPTS_PER_PAGE;
    return filteredDepartments.slice(start, start + DEPTS_PER_PAGE);
  }, [filteredDepartments, page]);

  // Modal open for add
  const handleAddDepartment = () => {
    setModalMode("add");
    setFormDept({
      name: "",
      department_head_id: "",
      subsidiary_id: "",
    });
    setShowDepartmentModal(true);
  };

  // Modal open for edit
  const handleEditDepartment = (dept) => {
    setModalMode("edit");
    setModalDept(dept);
    setFormDept({
      name: dept.name,
      department_head_id: dept.department_head_id,
      subsidiary_id: dept.subsidiary_id,
    });
    setShowDepartmentModal(true);
  };

  // Save handler for modal (add or edit)
  const handleDepartmentModalSave = async () => {
    if (!formDept.name || !formDept.department_head_id || !formDept.subsidiary_id) {
      return;
    }
    if (modalMode === "add") {
      const apiPayload = {
        name: formDept.name,
        department_head_id: parseInt(formDept.department_head_id, 10),
        subsidiary_id: parseInt(formDept.subsidiary_id, 10),
      };
      api("department_create", headerReq, apiPayload)
        .then((res) => {
          setDepartments((prev) => [
            ...prev,
            { ...apiPayload, id: res.id },
          ]);
          setShowDepartmentModal(false);
        })
        .catch(() => {
          alert("Department creation failed. Please try again.");
        });
    } else if (modalMode === "edit" && modalDept) {
      const apiPayload = {
        id: modalDept.id,
        name: formDept.name,
        department_head_id: parseInt(formDept.department_head_id, 10),
        subsidiary_id: parseInt(formDept.subsidiary_id, 10),
      };
      api("department_update", { ...headerReq, id: modalDept.id }, apiPayload)
        .then(() => {
          setDepartments((prev) =>
            prev.map((dept) =>
              dept.id === modalDept.id ? { ...dept, ...apiPayload } : dept
            )
          );
          setShowDepartmentModal(false);
        })
        .catch(() => {
          alert("Department update failed. Please try again.");
        });
    }
  };

  // Delete handler
  const handleDelete = async (id) => {
    api("department_delete", { ...headerReq, id })
      .then(() => {
        setDepartments((prev) => prev.filter((dept) => dept.id !== id));
      })
      .catch(() => {
        alert("Department deletion failed. Please try again.");
      });
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  useEffect(() => {
    document.title = "Departments | Aidea Time Charging";
    // fetchStaffs();
  }, [search, sortConfig]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="container-fluid h-full">
        {showDepartmentModal && (
          <DepartmentsModal
            modalMode={modalMode}
            formDept={formDept}
            setFormDept={setFormDept}
            onClose={() => setShowDepartmentModal(false)}
            onSave={handleDepartmentModalSave}
            subsidiaries={subsidiaries}
            staffs={staffs}
          />
        )}

        {deleteModalVisible && (
          <DepartmentalTasksDeleteModal
            departmentId={departmentIdToDelete}
            setModalVisible={setDeleteModalVisible}
            handleDelete={handleDelete}
          />
        )}

        <div className="w-full sticky top-0 bg-white flex justify-between items-center border-b p-3 z-10">
          <h1 className="text-xl font-semibold text-gray-700">Departments</h1>
          <div className="flex gap-3">
            <Search
              value={search}
              onChange={handleSearchChange}
              placeholder="Search department"
            />
            <div
              className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 shadow-sm cursor-pointer min-h-[40px] px-3"
              onClick={handleAddDepartment}
              style={{ minHeight: 40 }}
            >
              <span className="flex items-center justify-center text-gray-500">
                <Plus size={20} />
              </span>
            </div>
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
                <DepartmentsTable
                  departments={paginatedDepartments}
                  subsidiaries={subsidiaries}
                  staffs={staffs}
                  onEdit={handleEditDepartment}
                  onDelete={(id) => {
                    setDepartmentIdToDelete(id);
                    setDeleteModalVisible(true);
                  }}
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
            totalRecords={departments.length}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
};

export default Departments;
