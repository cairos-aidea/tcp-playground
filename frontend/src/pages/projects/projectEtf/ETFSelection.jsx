import React, { useState, useEffect } from "react";
import { useAppData } from "../../../context/AppDataContext";
import Search from "../../../components/navigations/Search";

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
      // && project.studio_id === auth_user.department.id
      // && project.studio_id === 30
    );

  // Get recent opened projects that are in filteredProjects
  const recentOpenedProjects = recentProjects
    .map(rp => filteredProjects.find(p => p.id === rp.id))
    .filter(Boolean);

  // Get the rest of the filtered projects (not in recent)
  const otherProjects = filteredProjects.filter(
    p => !recentOpenedProjects.some(rp => rp.id === p.id)
  );

  // Row component for project
  const ProjectRow = ({ project, onClick, lastOpened }) => (
    <button
      type="button"
      className="w-full flex items-center justify-between px-4 py-3 border-b hover:bg-blue-50 transition cursor-pointer text-left text-gray-800"
      onClick={() => onClick(project)}
    >
      <div>
        <div className="font-semibold text-base sm:text-lg">{project.project_name}</div>
        <div className="text-sm text-gray-600">{project.project_code}</div>
        {lastOpened && (
          <div className="text-xs text-blue-500 mt-1">
            Last opened: {lastOpened}
          </div>
        )}
      </div>
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen h-screen bg-gray-50">
      <div className="container-fluid flex-1 flex flex-col h-full max-h-full">
        {/* Header remains unchanged */}
        <div className="w-full sticky top-0 z-10 bg-white border-b">
          <div className="flex h-14 items-center justify-between px-6">
            <h1 className="text-xl font-semibold text-gray-700">ETF</h1>
            <div className="flex gap-3">
              {/* <Search placeholder="Search task" /> */}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-0 py-0 min-h-0 h-full max-h-full">
          <div className="w-full h-full bg-white border border-gray-200 p-0 flex flex-col min-h-0 max-h-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 pt-6 pb-2 gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Select a Project</h2>

              <Search
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search project"
              />
            </div>

            <div className="flex-1 min-h-0 max-h-full overflow-auto px-6 pb-6">
              <table className="min-w-full h-full table-auto border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 sticky top-0 z-10">
                    <th className="px-4 py-3 font-medium text-left rounded-tl-xl">Project Name</th>
                    <th className="px-4 py-3 font-medium text-left">Code</th>
                    <th className="px-4 py-3 font-medium text-left">Status</th>
                    <th className="px-4 py-3 font-medium text-left">Last Opened</th>
                    <th className="px-4 py-3 font-medium text-left rounded-tr-xl">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOpenedProjects.length > 0 && (
                    <>
                      <tr className="h-16">
                        <td colSpan={5} className="bg-gray-50 text-xs text-indigo-600 font-semibold px-4 py-2 border-b align-middle">Recent Projects</td>
                      </tr>
                      {recentOpenedProjects.map((project) => {
                        const rp = recentProjects.find(rp => rp.id === project.id);
                        let lastOpened = "";
                        if (rp && rp.openedAt) {
                          const date = new Date(rp.openedAt);
                          lastOpened = date.toLocaleString();
                        }
                        return (
                          <tr key={project.id} className="hover:bg-blue-50 transition border-b h-16">
                            <td className="px-4 py-3 font-semibold text-base sm:text-lg">{project.project_name}</td>
                            <td className="px-4 py-3 text-gray-600">{project.project_code}</td>
                            <td className="px-4 py-3 text-gray-500">{project.project_status}</td>
                            <td className="px-4 py-3 text-blue-500">{lastOpened}</td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 shadow-sm hover:shadow"
                                onClick={() => handleProjectClick(project)}
                              >
                                Open
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="h-16">
                        <td colSpan={5} className="bg-gray-50 text-xs text-right px-4 py-2 border-b align-middle">
                          <button
                            type="button"
                            className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
                            onClick={() => {
                              setRecentProjects([]);
                              localStorage.removeItem(RECENT_PROJECTS_KEY);
                            }}
                          >
                            <span>Clear Recent</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    </>
                  )}

                  {/* Other Projects */}
                  {otherProjects.length > 0 && (
                    <>
                      <tr className="h-16">
                        <td colSpan={5} className="bg-gray-50 text-xs text-gray-600 font-semibold px-4 py-2 border-b align-middle">All Projects</td>
                      </tr>
                      {otherProjects.map((project) => (
                        <tr key={project.id} className="hover:bg-blue-50 transition border-b h-16">
                          <td className="px-4 py-3 font-semibold text-base sm:text-lg">{project.project_name}</td>
                          <td className="px-4 py-3 text-gray-600">{project.project_code}</td>
                          <td className="px-4 py-3 text-gray-500">{project.project_status}</td>
                          <td className="px-4 py-3">-</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 shadow-sm hover:shadow"
                              onClick={() => handleProjectClick(project)}
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* No Projects Found */}
                  {filteredProjects.length === 0 && (
                    <tr className="h-16">
                      <td colSpan={5} className="py-8 text-center text-gray-400">No projects found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ETFSelection;
