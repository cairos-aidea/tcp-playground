import React, { useState, useEffect } from "react";
import { useAppData } from "../../../context/AppDataContext";
import PageContainer from "@/components/ui/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, History, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const RECENT_PROJECTS_KEY = "recentOpenedProjects";

const ETFSelection = ({ onSelectProject }) => {
  const {
    projects,
  } = useAppData();
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

  // Filter projects
  const filteredProjects = (projects || [])
    .filter(
      project =>
        project.project_status !== "Lost Proposal" &&
        project.project_status !== "Aborted Proposal" &&
        (project.project_name.toLowerCase().includes(search.toLowerCase()) ||
          project.project_code.toLowerCase().includes(search.toLowerCase()))
    );

  // Get recent opened projects that are in filteredProjects
  const recentOpenedProjects = recentProjects
    .map(rp => filteredProjects.find(p => p.id === rp.id))
    .filter(Boolean);

  // Get the rest of the filtered projects (not in recent)
  const otherProjects = filteredProjects.filter(
    p => !recentOpenedProjects.some(rp => rp.id === p.id)
  );

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-start min-h-[calc(100vh-100px)] py-10">
        <div className="w-full max-w-5xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">ETF Management</h1>
            <p className="text-muted-foreground">Select a project to manage Estimated Time of Force (ETF) and Manpower Allocation.</p>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Projects</CardTitle>
                  <CardDescription>Search and select a project to proceed.</CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search project name or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 bg-muted/50"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[40%]">Project Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Opened</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Recent Projects Section */}
                  {recentOpenedProjects.length > 0 && (
                    <>
                      <TableRow className="hover:bg-transparent bg-muted/10">
                        <TableCell colSpan={5} className="font-semibold text-xs text-muted-foreground uppercase tracking-wider py-2">
                          <div className="flex items-center gap-2">
                            <History className="h-3 w-3" /> Recent Projects
                          </div>
                        </TableCell>
                      </TableRow>
                      {recentOpenedProjects.map((project) => {
                        const rp = recentProjects.find(rp => rp.id === project.id);
                        let lastOpened = "";
                        if (rp && rp.openedAt) {
                          const date = new Date(rp.openedAt);
                          lastOpened = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        }
                        return (
                          <TableRow key={project.id} className="group cursor-pointer hover:bg-muted/50" onClick={() => handleProjectClick(project)}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{project.project_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{project.project_code}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal text-xs">{project.project_status}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{lastOpened}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <FolderOpen className="h-4 w-4 text-primary" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  )}

                  {/* All Projects Section */}
                  {otherProjects.length > 0 && (
                    <>
                      <TableRow className="hover:bg-transparent bg-muted/10 border-t">
                        <TableCell colSpan={5} className="font-semibold text-xs text-muted-foreground uppercase tracking-wider py-2">
                          All Projects
                        </TableCell>
                      </TableRow>
                      {otherProjects.map((project) => (
                        <TableRow key={project.id} className="group cursor-pointer hover:bg-muted/50" onClick={() => handleProjectClick(project)}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{project.project_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{project.project_code}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal text-xs">{project.project_status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">-</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <FolderOpen className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}

                  {filteredProjects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No projects found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {recentProjects.length > 0 && (
            <div className="flex justify-center">
              <Button
                variant="link"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={() => {
                  setRecentProjects([]);
                  localStorage.removeItem(RECENT_PROJECTS_KEY);
                }}
              >
                Clear Recent History
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default ETFSelection;
