"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useAppData } from '../../../context/AppDataContext';
import { api } from '../../../api/api';
import { errorNotification, successNotification } from '../../../components/notifications/notifications';
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ArrowUpDown, MoreHorizontal, SquarePen, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactLoading from "react-loading";
import ProjectsExternalModal from "./components/ProjectsExternalModal";
import ProjectsExternalDeleteModal from "./components/ProjectsExternalDeleteModal";
import { PageContainer } from "@/components/ui/PageContainer";

const initialFormState = {
  project_code: "",
  project_name: "",
  studio: "",
  owner_id: "",
  project_status: "active",
};

const Projects = () => {
  const {
    projects,
    setProjects,
    staffs,
    departments,
    isLoading,
    headerReq,
    auth_user
  } = useAppData();

  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [formState, setFormState] = useState(initialFormState);

  useEffect(() => {
    document.title = "Projects External | Aidea Time Charging";
  }, []);

  // --- Handlers ---

  const handleAdd = () => {
    setEditingProject(null);
    setFormState(initialFormState);
    setModalVisible(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormState({
      project_code: project.project_code,
      project_name: project.project_name,
      studio: project.studio,
      owner_id: project.owner_id,
      project_status: project.project_status || "active",
    });
    setModalVisible(true);
  };

  const openDeleteModal = (project) => {
    setProjectToDelete(project);
    setDeleteModalVisible(true);
  };

  const handleModalOk = async (e) => {
    e.preventDefault();
    if (!formState.project_code || !formState.project_name || !formState.studio || !formState.owner_id) {
      errorNotification({ title: "Validation Error", message: "All fields are required." });
      return;
    }

    try {
      if (editingProject) {
        // Update
        const apiPayload = {
          ...formState,
          id: editingProject.id,
          owner_id: Number(formState.owner_id)
        };

        // Note: The original API for update used field/value pairs, but let's assume standard update object for now based on Internal Projects pattern
        // If strictly following old pattern, we'd need loop. But let's try standard object first or fall back to loop if needed.
        // Actually, looking at old code: api("project_update", ... apiPayload) where payload key was 'field' and 'value'.
        // The old code did ONE field update at a time.
        // Refactoring to multiple updates or a single update endpoint if available? 
        // Internal Projects uses `project_internal_update` with full object.
        // External Projects uses `project_update` with `field`, `value`.
        // We might need to call update multiple times or backend supports it?
        // Let's assume for now we must use the old pattern if backend is strict.

        // To be safe and "Zero Breakage", we should loop through changes or assume backend handles it.
        // However, typical "project_update" might only support one field.
        // Let's try to send requests for changed fields.

        const updates = [];
        if (formState.project_code !== editingProject.project_code) updates.push({ field: 'project_code', value: formState.project_code });
        if (formState.project_name !== editingProject.project_name) updates.push({ field: 'project_name', value: formState.project_name });
        if (formState.studio !== editingProject.studio) updates.push({ field: 'studio', value: formState.studio });
        if (Number(formState.owner_id) !== Number(editingProject.owner_id)) updates.push({ field: 'owner_id', value: Number(formState.owner_id) });
        if (formState.project_status !== editingProject.project_status) updates.push({ field: 'project_status', value: formState.project_status });

        await Promise.all(updates.map(u =>
          api("project_update", { ...headerReq, id: editingProject.id }, { id: editingProject.id, ...u })
        ));

        setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...formState, owner_id: Number(formState.owner_id) } : p));
        successNotification({ title: "Updated", message: "Project updated successfully." });

      } else {
        // Create
        const owner = staffs.find(s => s.id === Number(formState.owner_id));
        const ownerName = owner ? (owner.name || owner.username) : "";
        const newProjectPayload = { ...formState, owner_id: Number(formState.owner_id), owner_name: ownerName };

        const res = await api("project_create", headerReq, newProjectPayload);
        setProjects(prev => [...prev, { ...newProjectPayload, id: res.id }]);
        successNotification({ title: "Created", message: "Project created successfully." });
      }
      setModalVisible(false);
    } catch (error) {
      errorNotification({ title: "Error", message: "Failed to save project. " + (error.message || "") });
    }
  };

  const handleDeleteProject = async (projectId, projectCode) => {
    try {
      // Old code uses specific payload structure
      const apiPayload = { id: projectId, field: "", value: "" };
      await api('project_delete', { ...headerReq, id: projectId }, apiPayload);

      setProjects(prev => prev.filter(p => p.id !== projectId));
      successNotification({ title: "Deleted", message: "Project deleted successfully." });
    } catch (error) {
      errorNotification({ title: "Error", message: "Failed to delete project." });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  // --- DataTable Configuration ---

  const filteredProjects = useMemo(() => {
    if (!search) return projects;
    const lower = search.toLowerCase();
    return projects.filter(p =>
      (p.project_name?.toLowerCase().includes(lower)) ||
      (p.project_code?.toLowerCase().includes(lower)) ||
      (p.studio?.toLowerCase().includes(lower))
    );
  }, [projects, search]);

  const columns = useMemo(() => [
    {
      accessorKey: "project_code",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Code <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "project_name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Project Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "studio",
      header: "Studio",
    },
    {
      accessorKey: "owner_id", // We display name, but sort/filter key is owner_id technically, or we can use accessorFn
      header: "Owner",
      cell: ({ row }) => {
        const owner = staffs.find(s => s.id === row.original.owner_id);
        return owner ? (owner.name || owner.username) : <span className="text-muted-foreground">N/A</span>;
      }
    },
    {
      accessorKey: "project_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("project_status");
        let colorClass = "bg-gray-100 text-gray-800";
        if (status === 'active') colorClass = "bg-green-100 text-green-800";
        if (status === 'inactive') colorClass = "bg-red-100 text-red-800";
        if (status === 'completed') colorClass = "bg-blue-100 text-blue-800";

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>
            {status}
          </span>
        )
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const project = row.original;
        // Assuming only admins/managers can edit? Original code checked role_id for owner selection but not explicitly for edit actions in table?
        // Internal projects allowed role_id === 3. Let's assume Admin (3) for now or match original.
        // Original `Projects.jsx` allowed edit if valid token? It didn't seem to restrict generic edit, but let's stick to safe side.
        // Showing actions for everyone for now, maybe restrict later if needed.

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(project)}>
                <SquarePen className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openDeleteModal(project)} className="text-red-600 focus:text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ], [staffs]);

  return (
    <PageContainer>
      <div className="flex-1 space-y-6">

        <ProjectsExternalModal
          isVisible={modalVisible}
          editingProject={editingProject}
          formState={formState}
          setFormState={setFormState}
          handleModalOk={handleModalOk}
          handleInputChange={handleInputChange}
          setModalVisible={setModalVisible}
          staffs={staffs}
          departments={departments}
        />

        <ProjectsExternalDeleteModal
          isVisible={deleteModalVisible}
          setModalVisible={setDeleteModalVisible}
          handleDelete={handleDeleteProject}
          project={projectToDelete}
        />

        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">External Projects</h2>
            <p className="text-muted-foreground">Manage external projects and studios.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" /> Add Project
            </Button>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="space-y-4">
          <div className="flex items-center max-w-sm">
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[300px]"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center p-10">
              <ReactLoading type="bars" color="#000" height={40} width={40} />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredProjects}
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default Projects;