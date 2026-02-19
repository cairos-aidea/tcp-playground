import React, { useState, useMemo, useEffect } from "react";
import { useAppData } from "../../../context/AppDataContext";
import { api } from "../../../api/api";
import PageContainer from "@/components/ui/PageContainer";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import ReactLoading from "react-loading";
import { columns } from "./components/columns";
import DepartmentDialog from "./components/DepartmentDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const Departments = () => {
  const {
    isLoading,
    departments,
    setDepartments,
    staffs,
    subsidiaries,
    headerReq,
  } = useAppData();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

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

  const processedDepartments = useMemo(() => {
    return departments.map(d => ({
      ...d,
      department_head_name: getUserName(d.department_head_id),
      subsidiary_name: getSubsidiaryName(d.subsidiary_id)
    }));
  }, [departments, staffs, subsidiaries]);

  const filteredDepartments = useMemo(() => {
    if (!search) return processedDepartments;
    const lowerSearch = search.toLowerCase();
    return processedDepartments.filter(
      (d) =>
        d.name.toLowerCase().includes(lowerSearch) ||
        d.department_head_name.toLowerCase().includes(lowerSearch) ||
        d.subsidiary_name.toLowerCase().includes(lowerSearch)
    );
  }, [processedDepartments, search]);

  const handleAdd = () => {
    setSelectedDept(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (dept) => {
    setSelectedDept(dept);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (dept) => {
    setDeleteId(dept.id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    api("department_delete", { ...headerReq, id: deleteId })
      .then(() => {
        setDepartments((prev) => prev.filter((dept) => dept.id !== deleteId));
        setDeleteId(null);
      })
      .catch(() => {
        alert("Department deletion failed. Please try again."); // Replace with Toast
      });
  };

  const handleSave = (formData) => {
    if (!formData.name || !formData.department_head_id || !formData.subsidiary_id) return;

    const payload = {
      name: formData.name,
      department_head_id: parseInt(formData.department_head_id, 10),
      subsidiary_id: parseInt(formData.subsidiary_id, 10),
    };

    if (selectedDept) {
      // Update
      api("department_update", { ...headerReq, id: selectedDept.id }, payload)
        .then(() => {
          setDepartments((prev) =>
            prev.map((dept) =>
              dept.id === selectedDept.id ? { ...dept, ...payload } : dept
            )
          );
          setIsDialogOpen(false);
        })
        .catch(() => {
          alert("Update failed.");
        });
    } else {
      // Create
      api("department_create", headerReq, payload)
        .then((res) => {
          setDepartments((prev) => [
            ...prev,
            { ...payload, id: res.id },
          ]);
          setIsDialogOpen(false);
        })
        .catch(() => {
          alert("Creation failed.");
        });
    }
  };

  useEffect(() => {
    document.title = "Departments | Aidea Time Charging";
  }, []);

  return (
    <PageContainer>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Departments</h2>
            <p className="text-muted-foreground">Manage organizational departments.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={handleAdd} size="icon" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <ReactLoading type="bars" color="#888888" />
          </div>
        ) : (
          <DataTable
            columns={columns(handleEdit, handleDeleteClick)}
            data={filteredDepartments}
          />
        )}

        <DepartmentDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          department={selectedDept}
          onSave={handleSave}
          subsidiaries={subsidiaries}
          staffs={staffs}
        />

        <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this department? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
};

export default Departments;
