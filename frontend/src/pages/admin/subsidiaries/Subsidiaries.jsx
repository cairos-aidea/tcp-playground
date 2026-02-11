import React, { useState, useMemo, useEffect } from "react";
import { useAppData } from "../../../context/AppDataContext";
import { api } from "../../../api/api";
import { Plus } from 'lucide-react';
import SubsidiariesTable from "./components/SubsidiariesTable";
import Pagination from "../../../components/navigations/Pagination";
import Search from "../../../components/navigations/Search";
import SubsidiariesModal from "./components/SubsidiariesModal";
import SubsidiariesDeleteModal from "./components/SubsidiariesDeleteModal";
import { errorNotification, successNotification, pendingNotification } from '../../../components/notifications/notifications';
import ReactLoading from "react-loading";

const Subsidiaries = () => {
  const {
    isLoading,
    subsidiaries,
    setSubsidiaries,
    staffs,
    headerReq,
  } = useAppData();

  const [page, setPage] = useState(1);
  const SUBS_PER_PAGE = 25;

  // Modal state for Add/Edit Subsidiary
  const [showSubsidiaryModal, setShowSubsidiaryModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [modalSub, setModalSub] = useState(null); // For editing

  // State for delete confirmation modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [subsidiaryIdToDelete, setSubsidiaryIdToDelete] = useState(null);

  // Helper: Get user name from id
  const getUserName = (id) => {
    const user = staffs.find((u) => u.id === Number(id));
    return user ? `${user.first_name} ${user.last_name}` : "";
  };

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // For add/edit modal form state
  const [formSub, setFormSub] = useState({
    name: "",
    manager_id: "",
  });

  // Filtered and sorted subsidiaries
  const filteredSubsidiaries = useMemo(() => {
    let filtered = subsidiaries.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        getUserName(s.manager_id).toLowerCase().includes(search.toLowerCase()) ||
        String(s.id).includes(search)
    );
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key === "manager_id") {
          aValue = getUserName(a.manager_id);
          bValue = getUserName(b.manager_id);
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
  }, [subsidiaries, search, sortConfig, staffs]);

  // Paginate subsidiaries
  const totalPages = Math.ceil(filteredSubsidiaries.length / SUBS_PER_PAGE);
  const paginatedSubsidiaries = useMemo(() => {
    const start = (page - 1) * SUBS_PER_PAGE;
    return filteredSubsidiaries.slice(start, start + SUBS_PER_PAGE);
  }, [filteredSubsidiaries, page]);

  // Modal open for add
  const handleAddSubsidiary = () => {
    setModalMode("add");
    setFormSub({
      name: "",
      manager_id: "",
    });
    setShowSubsidiaryModal(true);
  };

  // Modal open for edit
  const handleEditSubsidiary = (sub) => {
    setModalMode("edit");
    setModalSub(sub);
    setFormSub({
      name: sub.name,
      manager_id: sub.manager_id,
    });
    setShowSubsidiaryModal(true);
  };

  // Save handler for modal (add or edit)
  const handleSubsidiaryModalSave = async () => {
    if (!formSub.name || !formSub.manager_id) {
      return;
    }
    if (modalMode === "add") {
      const apiPayload = {
        name: formSub.name,
        manager_id: parseInt(formSub.manager_id, 10),
      };
      api("subsidiary_create", headerReq, apiPayload)
        .then((res) => {
          setSubsidiaries((prev) => [
            ...prev,
            { ...apiPayload, id: res.id },
          ]);
          setShowSubsidiaryModal(false);
        })
        .catch(() => {
          alert("Subsidiary creation failed. Please try again.");
        });
    } else if (modalMode === "edit" && modalSub) {
      const apiPayload = {
        id: modalSub.id,
        name: formSub.name,
        manager_id: parseInt(formSub.manager_id, 10),
      };
      api("subsidiary_update", { ...headerReq, id: modalSub.id }, apiPayload)
        .then(() => {
          setSubsidiaries((prev) =>
            prev.map((sub) =>
              sub.id === modalSub.id ? { ...sub, ...apiPayload } : sub
            )
          );
          setShowSubsidiaryModal(false);
        })
        .catch(() => {
          alert("Subsidiary update failed. Please try again.");
        });
    }
  };

  // Delete handler
  const handleDelete = async (id) => {
    api("subsidiary_delete", { ...headerReq, id })
      .then(() => {
        setSubsidiaries((prev) => prev.filter((sub) => sub.id !== id));
      })
      .catch(() => {
        alert("Subsidiary deletion failed. Please try again.");
      });
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  useEffect(() => {
    document.title = "Subsidiaries | Aidea Time Charging";
  }, [search, sortConfig]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="container-fluid h-full">
        {showSubsidiaryModal && (
          <SubsidiariesModal
            modalMode={modalMode}
            formSub={formSub}
            setFormSub={setFormSub}
            onClose={() => setShowSubsidiaryModal(false)}
            onSave={handleSubsidiaryModalSave}
            staffs={staffs}
          />
        )}

        {deleteModalVisible && (
          <SubsidiariesDeleteModal
            subsidiaryId={subsidiaryIdToDelete}
            setModalVisible={setDeleteModalVisible}
            handleDelete={handleDelete}
          />
        )}

        <div className="w-full sticky top-0 bg-white flex justify-between items-center border-b p-3 z-10">
          <Pagination
            currentPage={page}
            lastPage={totalPages}
            totalPages={totalPages}
            totalRecords={subsidiaries.length}
            onPageChange={setPage}
          />

          <div className="flex gap-3">
            <Search
              value={search}
              onChange={handleSearchChange}
              placeholder="Search subsidiary"
            />
            <div
              className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 shadow-sm cursor-pointer min-h-[40px] px-3"
              onClick={handleAddSubsidiary}
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
                <SubsidiariesTable
                  subsidiaries={paginatedSubsidiaries}
                  staffs={staffs}
                  onEdit={handleEditSubsidiary}
                  onDelete={(id) => {
                    setSubsidiaryIdToDelete(id);
                    setDeleteModalVisible(true);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subsidiaries;
