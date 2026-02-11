import React, { useState, useEffect, useMemo } from "react";
import { useAppData } from "../../../context/AppDataContext";
import { api } from "../../../api/api";
import { Plus } from "lucide-react";
import ProjectsInternalTable from "./components/ProjectsInternalTable";
import ProjectsInternalModal from "./components/ProjectsInternalModal";
import Pagination from "../../../components/navigations/Pagination";
import Search from "../../../components/navigations/Search";
import ProjectsInternalDeleteModal from "./components/ProjectsInternalDeleteModal";
import { errorNotification, successNotification, pendingNotification } from '../../../components/notifications/notifications';
import ReactLoading from "react-loading";

const initialFormState = {
  project_code: "",
  project_name: "",
  subsidiary_id: "",
  project_status: "",
};

const ProjectsInternal = () => {
  const { auth_user, isLoading, projectsInternal, setProjectsInternal, subsidiaries, headerReq } = useAppData();
  const [page, setPage] = useState(1);
  const PROJECTS_INTERNAL_PER_PAGE = 25;

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false); // State for delete modal visibility
  const [projectIdToDelete, setProjectIdToDelete] = useState(null); // Store the project ID to delete
  const [message, setMessage] = useState(null);

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });

  const getSubsidiaryName = (id) => {
    const sub = subsidiaries.find((s) => s.id === Number(id));
    return sub ? sub.name : "";
  };

  const filteredProjects = useMemo(() => {
    let filtered = Array.isArray(projectsInternal.projects)
      ? projectsInternal.projects.filter(
        (p) =>
          p.project_code.toLowerCase().includes(search.toLowerCase()) ||
          p.project_name.toLowerCase().includes(search.toLowerCase()) ||
          getSubsidiaryName(p.subsidiary_id).toLowerCase().includes(search.toLowerCase()) ||
          String(p.id).includes(search)
      )
      : [];
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key === "subsidiary_id") {
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
  }, [projectsInternal, search, sortConfig, subsidiaries]);

  const totalPages = Math.ceil(filteredProjects.length / PROJECTS_INTERNAL_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * PROJECTS_INTERNAL_PER_PAGE;
    return filteredProjects.slice(start, start + PROJECTS_INTERNAL_PER_PAGE);
  }, [filteredProjects, page]);

  const handleAdd = () => {
    setEditingProject(null);
    setFormState(initialFormState);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingProject(record);
    setFormState(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    api("project_internal_delete", { ...headerReq, id })
      .then(() => {
        setProjectsInternal((prev) => ({
          ...prev,
          projects: Array.isArray(prev.projects)
            ? prev.projects.filter((p) => p.id !== id)
            : [],
        }));
        setMessage({ type: "success", text: "Project deleted" });
      })
      .catch(() => {
        setMessage({ type: "error", text: "Failed to delete project" });
      });
  };

  const handleModalOk = async (e) => {
    e.preventDefault();
    if (!formState.project_code || !formState.project_name || !formState.subsidiary_id || !formState.project_status) {
      setMessage({ type: "error", text: "All fields are required" });
      return;
    }
    try {
      if (editingProject) {
        const apiPayload = { ...formState, subsidiary_id: parseInt(formState.subsidiary_id, 10) };

        api("project_internal_update", { ...headerReq, id: editingProject.id }, apiPayload)
          .then((res) => {
            setProjectsInternal((prev) => ({
              ...prev,
              projects: Array.isArray(prev.projects)
                ? prev.projects.map((p) => (p.id === editingProject.id ? res : p))
                : [],
            }));
            // setMessage({ type: "success", text: "Project updated" });
          })
          .catch(() => {
            errorNotification({ type: "error", text: "Failed to update project" });
          });
      } else {
        const apiPayload = { ...formState, subsidiary_id: parseInt(formState.subsidiary_id, 10) };

        api("project_internal_create", headerReq, apiPayload)
          .then((res) => {
            setProjectsInternal((prev) => ({
              ...prev,
              projects: Array.isArray(prev.projects) ? [...prev.projects, res] : [res],
            }));
            // setMessage({ type: "success", text: "Project added" });
          })
          .catch(() => {
            errorNotification({ type: "error", text: "Failed to add project" });
          });
      }
      setModalVisible(false);
    } catch {
      errorNotification({ type: "error", text: "Failed to save project" });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const openDeleteModal = (id) => {
    setProjectIdToDelete(id);
    setDeleteModalVisible(true);
  };

  useEffect(() => {
    document.title = "Projects Internal | Aidea Time Charging";
  }, [search, sortConfig]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="container-fluid h-full">
        {modalVisible && (
          <ProjectsInternalModal
            editingProject={editingProject}
            formState={formState}
            setFormState={setFormState}
            handleModalOk={handleModalOk}
            handleInputChange={handleInputChange}
            setModalVisible={setModalVisible}
            subsidiaries={subsidiaries}
          />
        )}

        <ProjectsInternalDeleteModal
          isVisible={deleteModalVisible}
          setModalVisible={setDeleteModalVisible}
          handleDelete={handleDelete}
          projectId={projectIdToDelete}
        />

        <div className="w-full sticky top-0 bg-white flex justify-between items-center border-b p-3 z-10">
          <h1 className="text-xl font-semibold text-gray-700">Projects Internal</h1>
          <div className="flex gap-3">
            <Search
              value={search}
              onChange={handleSearchChange}
              placeholder="Search project"
            />
            {auth_user?.role_id === 3 && (
              <div
                className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 shadow-sm cursor-pointer min-h-[40px] px-3"
                onClick={handleAdd}
                style={{ minHeight: 40 }}
              >
                <span className="flex items-center justify-center text-gray-500">
                  <Plus size={20} />
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="col-span-12 overflow-x-auto h-full flex flex-col">
            {isLoading ? (
              <div className="flex items-center justify-center h-screen bg-gray-100">
                <ReactLoading type="bars" color="#888888" height={50} width={50} />
              </div>
            ) : (
              <div className="col-span-12 overflow-auto h-full flex flex-col pb-16 sm:pb-0">
                <ProjectsInternalTable
                  projects={paginatedProjects}
                  subsidiaries={subsidiaries}
                  handleEdit={handleEdit}
                  handleDelete={openDeleteModal} // Open delete modal instead of handling delete directly
                  confirmDeleteId={projectIdToDelete}
                  setConfirmDeleteId={setProjectIdToDelete}
                  auth_user={auth_user}
                />
              </div>
            )}
          </div>
        </div>

        {/* Add padding below pagination if width is 639px */}
        <div
          className="w-full sticky bottom-0 bg-white flex justify-center items-center border-t p-3 pb-20 sm:pb-3 z-10"
        >
          <Pagination
            currentPage={page}
            lastPage={totalPages}
            totalPages={totalPages}
            totalRecords={paginatedProjects.length}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectsInternal;

