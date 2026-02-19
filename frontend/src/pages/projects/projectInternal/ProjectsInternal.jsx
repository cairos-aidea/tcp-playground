"use client"

import React, { useState, useEffect, useMemo } from "react";
import { PageContainer } from "@/components/ui/PageContainer";
import { useAppData } from "../../../context/AppDataContext";
import { api } from "../../../api/api";
import { Plus, ArrowUpDown, MoreHorizontal, SquarePen, Trash2 } from "lucide-react";
import ProjectsInternalModal from "./components/ProjectsInternalModal";
import ProjectsInternalDeleteModal from "./components/ProjectsInternalDeleteModal";
// import Search from "../../../components/navigations/Search"; // Replacing with Shadcn Input
import { errorNotification, successNotification, pendingNotification } from '../../../components/notifications/notifications';
import ReactLoading from "react-loading";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge"; // Use Badge later if available, for now standard spans or badges

const initialFormState = {
  project_code: "",
  project_name: "",
  subsidiary_id: "",
  project_status: "",
};

const ProjectsInternal = () => {
  const { auth_user, isLoading, projectsInternal, setProjectsInternal, subsidiaries, headerReq } = useAppData();

  // Modal & Form States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [projectIdToDelete, setProjectIdToDelete] = useState(null);

  // Search State (Managed externally to DataTable for multi-column search)
  const [search, setSearch] = useState("");

  const getSubsidiaryName = (id) => {
    const sub = subsidiaries?.find((s) => s.id === Number(id));
    return sub ? sub.name : "";
  };

  // Filter Data
  const filteredProjects = useMemo(() => {
    let data = Array.isArray(projectsInternal.projects) ? projectsInternal.projects : [];
    if (!search) return data;

    return data.filter(
      (p) =>
        p.project_code?.toLowerCase().includes(search.toLowerCase()) ||
        p.project_name?.toLowerCase().includes(search.toLowerCase()) ||
        getSubsidiaryName(p.subsidiary_id)?.toLowerCase().includes(search.toLowerCase()) ||
        String(p.id).includes(search)
    );
  }, [projectsInternal, search, subsidiaries]);

  // Define Columns
  const columns = useMemo(() => [
    {
      accessorKey: "project_code",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Project Code
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "project_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Project Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "subsidiary_id",
      header: "Subsidiary",
      cell: ({ row }) => getSubsidiaryName(row.getValue("subsidiary_id")),
    },
    {
      accessorKey: "project_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("project_status");
        let colorClass = "bg-gray-100 text-gray-800";
        if (status === 'Active') colorClass = "bg-green-100 text-green-800";
        if (status === 'Inactive') colorClass = "bg-red-100 text-red-800";
        if (status === 'Closed') colorClass = "bg-gray-200 text-gray-800";

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {status}
          </span>
        )
      }
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const project = row.original

        if (auth_user?.role_id !== 3) return null; // Admin only actions

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
              <DropdownMenuItem onClick={() => openDeleteModal(project.id)} className="text-red-600 focus:text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [auth_user, subsidiaries]);


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

  const openDeleteModal = (id) => {
    setProjectIdToDelete(id);
    setDeleteModalVisible(true);
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
        successNotification({ title: "Deleted", message: "Project deleted successfully." }); // Assuming standard signature
      })
      .catch(() => {
        errorNotification({ type: "error", text: "Failed to delete project" });
      });
  };

  const handleModalOk = async (e) => {
    e.preventDefault();
    if (!formState.project_code || !formState.project_name || !formState.subsidiary_id || !formState.project_status) {
      errorNotification({ type: "error", text: "All fields are required" });
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
            successNotification({ title: "Updated", message: "Project updated successfully." });
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
            successNotification({ title: "Created", message: "Project added successfully." });
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

  return (
    <PageContainer>
      <div className="flex-1 space-y-6">

        {/* Modals */}
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

        {/* Header & Actions */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Internal Projects</h2>
            <p className="text-muted-foreground">Manage internal cost codes and project statuses.</p>
          </div>
          <div className="flex items-center space-x-2">
            {auth_user?.role_id === 3 && (
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" /> Add Project
              </Button>
            )}
          </div>
        </div>

        {/* Filters & Table */}
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex items-center max-w-sm">
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[300px]"
            />
          </div>

          {/* Usage of Shadcn DataTable */}
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

export default ProjectsInternal;
