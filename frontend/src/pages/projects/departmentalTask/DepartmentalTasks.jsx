import React, { useState, useEffect } from "react";
import { useAppData } from "../../../context/AppDataContext";
import PageContainer from "@/components/ui/PageContainer";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { api } from "../../../api/api";

// Helper to get subsidiary name
const getSubsidiaryName = (department_id, departments, subsidiaries) => {
  const department = departments?.find((d) => d.id === department_id);
  if (!department) return "Unknown";
  const subsidiary = subsidiaries?.find((s) => s.id === department.subsidiary_id);
  return subsidiary?.name || "Unknown";
};

export const columns = (departments, subsidiaries, handleDelete, handleEdit) => [
  {
    accessorKey: "task_name",
    header: "Task Name",
  },
  {
    accessorKey: "department_id",
    header: "Subsidiary",
    cell: ({ row }) => {
      const deptId = row.getValue("department_id");
      return getSubsidiaryName(deptId, departments, subsidiaries);
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(task)} className="h-8 w-8">
            <span className="sr-only">Edit</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} className="h-8 w-8 text-destructive hover:text-destructive">
            <span className="sr-only">Delete</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
          </Button>
        </div>
      );
    }
  }
];

const DepartmentalTasks = () => {
  const {
    departmentalTasks, // This is { tasks: [...] } based on previous file
    fetchDepartmentalTasks,
    departments,
    subsidiaries,
    headerReq,
    auth_user
  } = useAppData();

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Form State
  const [editingTask, setEditingTask] = useState(null);
  const [taskName, setTaskName] = useState("");
  const [deptId, setDeptId] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDepartmentalTasks();
      setLoading(false);
    }
    loadData();
  }, []);

  // Columns with Context
  const tableColumns = React.useMemo(() => columns(
    departments,
    subsidiaries,
    (id) => setDeleteId(id), // Handle Delete Trigger
    (task) => { // Handle Edit Trigger
      setEditingTask(task);
      setTaskName(task.task_name);
      setDeptId(task.department_id);
      setIsModalOpen(true);
    }
  ), [departments, subsidiaries]);

  // Handle Save
  const handleSave = async () => {
    if (!taskName || !deptId) return;

    const payload = {
      task_name: taskName,
      department_id: parseInt(deptId)
    };

    if (editingTask) {
      await api("departmental_task_update", { ...headerReq, id: editingTask.id }, payload);
    } else {
      await api("departmental_task_create", headerReq, payload);
    }

    await fetchDepartmentalTasks();
    setIsModalOpen(false);
    setEditingTask(null);
    setTaskName("");
    setDeptId("");
  };

  // Handle Delete Confirm
  const confirmDelete = async () => {
    if (deleteId) {
      await api("departmental_task_delete", { ...headerReq, id: deleteId });
      await fetchDepartmentalTasks();
      setDeleteId(null);
    }
  };

  const tasks = departmentalTasks?.tasks || [];

  const resetForm = () => {
    setEditingTask(null);
    setTaskName("");
    setDeptId("");
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Departmental Tasks</h2>
          <p className="text-muted-foreground">Manage standard tasks for departments.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Departmental Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Task Name</Label>
                <Input value={taskName} onChange={e => setTaskName(e.target.value)} />
              </div>
              <Button onClick={handleSave} className="w-full">Save Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={tableColumns}
        data={tasks}
        searchKey="task_name"
        loading={loading}
      />
    </PageContainer>
  );
};

export default DepartmentalTasks;
