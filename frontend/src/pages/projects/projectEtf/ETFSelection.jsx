import React, { useState, useEffect, useMemo } from "react";
import { useAppData } from "../../../context/AppDataContext";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { FolderOpen, ArrowUpDown } from "lucide-react";

const RECENT_PROJECTS_KEY = "recentOpenedProjects";

const ETFSelection = ({ onSelectProject }) => {
  const { projects } = useAppData();
  const [search, setSearch] = useState("");
  const [recentProjects, setRecentProjects] = useState([]);

  // Load recent opened projects from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
    if (stored) {
      setRecentProjects(JSON.parse(stored));
    }
  }, []);

  // Save recent opened projects to localStorage
  const handleProjectClick = (project) => {
    const now = Date.now();

    // Update recent opened list
    let updated = recentProjects.filter((p) => p.id !== project.id);
    updated.unshift({ id: project.id, openedAt: now });
    updated = updated.slice(0, 5);

    setRecentProjects(updated);
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(updated));

    onSelectProject({
      value: project.id,
      label: project.project_name,
    });
  };

  // Prepare data for DataTable
  const data = useMemo(() => {
    if (!projects) return [];

    // Filter projects
    const filtered = projects.filter(
      (project) =>
        project.project_status !== "Lost Proposal" &&
        project.project_status !== "Aborted Proposal" &&
        (project.project_name?.toLowerCase().includes(search.toLowerCase()) ||
          project.project_code?.toLowerCase().includes(search.toLowerCase()))
    );

    // Map to display format and include lastOpened timestamp for sorting
    return filtered.map(project => {
      const rp = recentProjects.find(r => r.id === project.id);
      return {
        ...project,
        lastOpened: rp ? rp.openedAt : 0, // 0 for never opened
      };
    }).sort((a, b) => b.lastOpened - a.lastOpened); // Sort by last opened desc
  }, [projects, search, recentProjects]);


  const columns = useMemo(() => [
    {
      accessorKey: "project_name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Project Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue("project_name")}</span>
    },
    {
      accessorKey: "project_code",
      header: "Code",
    },
    {
      accessorKey: "project_status",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline" className="font-normal text-xs">{row.getValue("project_status")}</Badge>
    },
    {
      accessorKey: "lastOpened",
      header: "Last Opened",
      cell: ({ row }) => {
        const ts = row.getValue("lastOpened");
        if (!ts) return "-";
        const date = new Date(ts);
        return <span className="text-xs text-muted-foreground">{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
      }
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => handleProjectClick(row.original)}
        >
          <FolderOpen className="h-4 w-4 text-primary" />
        </Button>
      )
    }
  ], [recentProjects]); // Re-create columns if recentProjects changes (affects handleProjectClick closure? No, function is stable-ish but dependencies good practice)

  return (
    <PageContainer>
      <div className="flex-1 space-y-6">

        {/* Header & Actions */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">ETF Management</h2>
            <p className="text-muted-foreground">Select a project to manage Estimated Time of Force (ETF) and Manpower Allocation.</p>
          </div>
          <div className="flex items-center space-x-2">
            {recentProjects.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRecentProjects([]);
                  localStorage.removeItem(RECENT_PROJECTS_KEY);
                }}
              >
                Clear History
              </Button>
            )}
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

          <DataTable
            columns={columns}
            data={data}
            enablePagination={false} // Keep all content loaded
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default ETFSelection;
