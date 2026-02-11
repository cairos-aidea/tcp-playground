import React, { useState, useMemo, useEffect } from "react";
import { useAppData } from "../../../context/AppDataContext";
import { api } from "../../../api/api";
import DepartmentalTasksTable from "./components/DepartmentalTasksTable";
import DepartmentalTasksModal from "./components/DepartmentalTasksModal";
import Pagination from "../../../components/navigations/Pagination";
import Search from "../../../components/navigations/Search";
import { Plus } from "lucide-react";
import DepartmentalTasksDeleteModal from "./components/DepartmentalTasksDeleteModal";
import { errorNotification, successNotification, pendingNotification } from '../../../components/notifications/notifications';

const TASKS_PER_PAGE = 25;

const DepartmentalTasks = () => {
  const {
    departmentalTasks,
    setDepartmentalTasks,
    departments,
    subsidiaries,
    headerReq,
    auth_user
  } = useAppData();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formState, setFormState] = useState({
    task_name: "",
    department_id: "",
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false); 
  const [taskIdToDelete, setTaskIdToDelete] = useState(null);

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [page, setPage] = useState(1);

  const getSubsidiaryName = (department_id) => {
    const department = departments?.find((d) => d.id === department_id);
    if (!department) return "Unknown";
    const subsidiary = subsidiaries?.find((s) => s.id === department.subsidiary_id);
    return subsidiary?.name || "Unknown";
  };

  const filteredTasks = useMemo(() => {
    let filtered = Array.isArray(departmentalTasks.tasks)
      ? departmentalTasks.tasks.filter(
          (t) =>
            t.task_name.toLowerCase().includes(search.toLowerCase()) ||
            getSubsidiaryName(t.department_id).toLowerCase().includes(search.toLowerCase()) ||
            String(t.id).includes(search)
        )
      : [];
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key === "department_id") {
          aValue = getSubsidiaryName(a.department_id);
          bValue = getSubsidiaryName(b.department_id);
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
  }, [departmentalTasks, search, sortConfig, departments, subsidiaries]);

  const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
  const paginatedTasks = useMemo(() => {
    const start = (page - 1) * TASKS_PER_PAGE;
    return filteredTasks.slice(start, start + TASKS_PER_PAGE);
  }, [filteredTasks, page]);

  const handleAdd = () => {
    setEditingTask(null);
    setFormState({
      task_name: "",
      department_id: "",
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingTask(record);
    setFormState({
      task_name: record.task_name,
      department_id: record.department_id,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    api("departmental_task_delete", { ...headerReq, id })
      .then(() => {
        setDepartmentalTasks((prev) => ({
          ...prev,
          tasks: Array.isArray(prev.tasks) ? prev.tasks.filter((t) => t.id !== id) : [],
        }));
        // successNotification({ title: "Task deleted", message: "The task was successfully deleted." });
      })
      .catch(() => {
        errorNotification({ title: "Task deletion failed", message: "Failed to delete task" });
      });
  };

  const handleModalOk = async (e) => {
    e.preventDefault();
    if (!formState.task_name || !formState.department_id) {
      return;
    }
    try {
      const apiPayload = {
        ...formState,
        department_id: parseInt(formState.department_id, 10),
      };

      if (editingTask) {
        api("departmental_task_update", { ...headerReq, id: editingTask.id }, apiPayload)
          .then(() => {
            setDepartmentalTasks((prev) => ({
              ...prev,
              tasks: Array.isArray(prev.tasks)
                ? prev.tasks.map((t) =>
                    t.id === editingTask.id ? { ...t, ...apiPayload } : t
                  )
                : [],
            }));
            // successNotification({ title: "Task updated", message: "The task was successfully updated." });
          })
          .catch(() => {
            errorNotification({ title: "Task update failed", message: "Failed to update task" });
          });
      } else {
        api("departmental_task_create", headerReq, apiPayload)
          .then((res) => {
            setDepartmentalTasks((prev) => ({
              ...prev,
              tasks: Array.isArray(prev.tasks) ? [...prev.tasks, res] : [res],
            }));
            // successNotification({ title: "Task added", message: "The task was successfully added." });
          })
          .catch(() => {
            errorNotification({ title: "Task addition failed", message: "Failed to add task" });
          });
      }
      setModalVisible(false);
    } catch {
      errorNotification({ title: "Task saving failed", message: "Failed to save task" });
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  useEffect(() => {
    document.title = "Departmental Tasks | Aidea Time Charging";
  }, [search, sortConfig]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="container-fluid h-full">
        {modalVisible && (
          <DepartmentalTasksModal
            formState={formState}
            setFormState={setFormState}
            handleModalOk={handleModalOk}
            setModalVisible={setModalVisible}
            editingTask={editingTask}
            departments={departments}
          />
        )}

        {/* Render the Delete Modal */}
        {deleteModalVisible && (
          <DepartmentalTasksDeleteModal
            taskId={taskIdToDelete}
            setModalVisible={setDeleteModalVisible}
            handleDelete={handleDelete}
          />
        )}

        <div className="w-full sticky top-0 bg-white flex justify-between items-center border-b p-3 z-10">
          <h1 className="text-xl font-semibold text-gray-700">Departmental Tasks</h1>
          
          <div className="flex gap-3">
            <Search
              value={search}
              onChange={handleSearchChange}
              placeholder="Search task"
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
          <div className="col-span-12 overflow-auto h-full flex flex-col pb-16 sm:pb-0">
            <DepartmentalTasksTable
              departmentalTasks={paginatedTasks}
              getSubsidiaryName={getSubsidiaryName}
              handleEdit={handleEdit}
              handleDelete={(id) => {
                setTaskIdToDelete(id); // Set the task ID to be deleted
                setDeleteModalVisible(true); // Show the delete confirmation modal
              }}
              setConfirmDeleteId={setConfirmDeleteId}
              confirmDeleteId={confirmDeleteId}
              departments={departments}
              auth_user={auth_user}
            />
          </div>
        </div>

        <div
          className="w-full sticky bottom-0 bg-white flex justify-center items-center border-t p-3 pb-20 sm:pb-3 z-10"
        >
          <Pagination
            currentPage={page}
            lastPage={totalPages}
            totalPages={totalPages}
            totalRecords={filteredTasks.length}
            onPageChange={setPage}
          /> 
        </div>
      </div>
    </div>
  );
};

export default DepartmentalTasks;
