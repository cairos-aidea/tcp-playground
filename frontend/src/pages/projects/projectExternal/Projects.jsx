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
    projectStages, // Make sure this is available in context
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
        // Update logic...
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
        // Create logic...
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

  const handleDeleteProject = async (projectId) => {
    try {
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

  // --- Sub-Component for Stages ---
  const renderSubComponent = ({ row }) => {
    const project = row.original;
    // Filter stages for this project
    // Assuming projectStages has project_id matching project.id
    // If not, we need to inspect the data structure. Assuming standard relational ID.
    const stages = projectStages?.filter(s => s.project_id === project.id) || [];

    if (stages.length === 0) {
      return <div className="p-4 text-sm text-muted-foreground">No stages defined for this project.</div>;
    }

    return (
      <div className="p-4 bg-muted/40 animate-in fade-in slide-in-from-top-2">
        <h4 className="mb-2 text-sm font-semibold tracking-tight">Project Stages for: {project.project_name}</h4>
        <div className="rounded-md border bg-background">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Stage Name</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Stage Start</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Stage Close</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {stages.map((stage) => (
                <tr key={stage.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">{stage.stage_name}</td>
                  <td className="p-4 align-middle">{stage.start_date || "-"}</td>
                  <td className="p-4 align-middle">{stage.end_date || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
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
      id: "expander",
      header: () => null,
      cell: ({ row }) => {
        return row.getCanExpand() ? (
          <button
            className="p-1 rounded-md hover:bg-muted"
            onClick={() => row.toggleExpanded()}
            style={{ cursor: "pointer" }}
          >
            {row.getIsExpanded() ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            )}
          </button>
        ) : null;
      },
    },
    {
      accessorKey: "project_name", // Swapped layout: Name first
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Project Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue("project_name")}</span>
    },
    {
      accessorKey: "project_code",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Project Code <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "owner_id",
      header: "Project Owner",
      cell: ({ row }) => {
        const owner = staffs.find(s => s.id === row.original.owner_id);
        const ownerName = owner ? (owner.name || owner.username) : "No project owner";
        return (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
              {ownerName.charAt(0)}
            </div>
            <span>{ownerName}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "studio",
      header: "Studio",
      cell: ({ row }) => row.getValue("studio") || "N/A"
    },
    {
      accessorKey: "project_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("project_status");
        // Simplified status text as per design
        return (
          <span className="text-sm">
            {status || "Unknown"}
          </span>
        )
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        // ... existing actions ...
        const project = row.original;
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


        {/* Header & Actions */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">External Projects</h2>
            <p className="text-muted-foreground">Manage external projects, codes, and stage tracking.</p>
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
            {/* Keeping search here */}
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
              getRowCanExpand={() => true} // All rows expandable
              renderSubComponent={renderSubComponent}
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
  // End Projects Component
};
export default Projects;