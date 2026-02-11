import { Fragment, useState, useEffect } from 'react';
import { ChevronDown, Trash2, CheckSquare, SquareX, Filter, ChevronUp } from 'lucide-react';

const HEADERS = [
  { key: 'project_name', label: 'Project Name' },
  { key: 'project_code', label: 'Project Code' },
  { key: 'owner_id', label: 'Project Owner' },
  { key: 'studio', label: 'Studio' },
  { key: 'project_status', label: 'Status' },
];

const STAGE_HEADERS = [
  { key: 'stage_name', label: 'Stage Name' },
  { key: 'start_date', label: 'Stage start' },
  { key: 'end_date', label: 'Stage close' },
];

const ProjectsTable = ({
  scrollContainerRef,
  filteredProjects,
  expandedProjects,
  toggleProject,
  getStagesForProject,
  renderCell,
  renderStageCell,
  handleDeleteProject,
  handleDeleteStage,
  handleNewStageChange,
  handleAddStage,
  newStage,
  newProject,
  handleNewProjectChange,
  handleAddProject,
  staffs,
  departments,
  auth_user
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [stageSortConfig, setStageSortConfig] = useState({});
  const [selectedOwner, setSelectedOwner] = useState(newProject.owner_id || '');

  const [selectedEditOwners, setSelectedEditOwners] = useState({});
  const [tooltipProject, setTooltipProject] = useState(null);
  const [activeStickyHeader, setActiveStickyHeader] = useState('project');

  useEffect(() => {
    const rootEl = scrollContainerRef?.current;
    if (!rootEl) return;

    const observerOptions = {
      root: rootEl,
      threshold: [0, 1],
    };

    const observers = [];

    Object.keys(expandedProjects).forEach(projectCode => {
      if (!expandedProjects[projectCode]) return;

      const headerEl = document.getElementById(`stage-header-${projectCode}`);
      if (!headerEl) return;

      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.intersectionRatio <= 0) {
            setActiveStickyHeader(projectCode);
          } else {
            setActiveStickyHeader('project');
          }
        });
      }, observerOptions);

      observer.observe(headerEl);
      observers.push(observer);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [expandedProjects, scrollContainerRef]);

  useEffect(() => {
    setSelectedOwner(newProject.owner_id || '');
  }, [newProject.owner_id]);

  useEffect(() => {
    const newEditOwners = {};
    filteredProjects.forEach(project => {
      newEditOwners[project.project_code] = project.owner_id || '';
    });
    setSelectedEditOwners(newEditOwners);
  }, [filteredProjects]);

  const handleSort = key => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleStageSort = (projectCode, key) => {
    setStageSortConfig(prev => {
      const prevConfig = prev[projectCode] || { key: null, direction: 'asc' };
      if (prevConfig.key === key) {
        return {
          ...prev,
          [projectCode]: { key, direction: prevConfig.direction === 'asc' ? 'desc' : 'asc' },
        };
      }
      return {
        ...prev,
        [projectCode]: { key, direction: 'asc' },
      };
    });
  };

  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronDown className="sort-icon" size={14} />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="sort-icon active" size={14} />
      : <ChevronDown className="sort-icon active" size={14} />;
  };

  const renderStageSortIndicator = (projectCode, key) => {
    const config = stageSortConfig[projectCode] || {};
    if (config.key !== key) {
      return <ChevronDown className="sort-icon" size={14} />;
    }
    return config.direction === 'asc'
      ? <ChevronUp className="sort-icon active" size={14} />
      : <ChevronDown className="sort-icon active" size={14} />;
  };

  const sortedProjects = (() => {
    if (!sortConfig.key) return filteredProjects;
    const sorted = [...filteredProjects].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (sortConfig.key === 'owner_id') {
        const getStaffName = id =>
          staffs.find(staff => staff.id === id)?.name ||
          staffs.find(staff => staff.id === id)?.email ||
          '';
        aValue = getStaffName(aValue);
        bValue = getStaffName(bValue);
      }
      if (sortConfig.key === 'studio') {
        aValue = aValue || '';
        bValue = bValue || '';
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
    return sorted;
  })();

  const getSortedStages = (projectCode, stages) => {
    const config = stageSortConfig[projectCode];
    if (!config || !config.key) return stages;
    const sorted = [...stages].sort((a, b) => {
      let aValue = a[config.key];
      let bValue = b[config.key];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return config.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return config.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
    return sorted;
  };

  // Helper to get initials for a staff
  const getStaffInitials = (staff) => {
    if (!staff) return '';
    if (staff.name) {
      const parts = staff.name.trim().split(' ');
      return parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
    } else if (staff.email) {
      return staff.email[0].toUpperCase();
    }
    return '';
  };

  // Handler for new project owner select change
  const handleOwnerChange = (e) => {
    setSelectedOwner(e.target.value);
    handleNewProjectChange(e);
  };

  // Handler for editing/updating project owner select change
  const handleEditOwnerChange = (projectCode, e) => {
    const value = e.target.value;
    setSelectedEditOwners(prev => ({
      ...prev,
      [projectCode]: value,
    }));
    if (typeof renderCell === 'function') {
      renderCell({ ...filteredProjects.find(p => p.project_code === projectCode), owner_id: value }, 'owner_id', e);
    }
  };

  // Track which project is being edited for owner (project_code)
  const [editingOwnerProject, setEditingOwnerProject] = useState(null);

  return (
    <table className="table-auto w-full text-sm text-left text-gray-900">
      <thead className={`bg-gray-100 text-sm font-bold ${activeStickyHeader === 'project' ? 'sticky top-0 z-10' : ''}`}>
        <tr>
          {HEADERS.map(header => (
            <th key={header.key} className="cursor-pointer p-4" onClick={() => handleSort(header.key)}>
              <div className="flex items-center">
                {header.label} {renderSortIndicator(header.key)}
              </div>
            </th>
          ))}
          {/* <th className="p-4"></th> */}
        </tr>
      </thead>
      <tbody>
        {sortedProjects.map((project, idx) => {
          const stages = getStagesForProject(project.project_code);
          const sortedStages = getSortedStages(project.project_code, stages);

          const editOwnerId = selectedEditOwners[project.project_code] ?? project.owner_id;
          const staff = staffs.find(s => String(s.id) === String(editOwnerId)) || {};
          const initials = getStaffInitials(staff);

          return (
            <Fragment key={project.project_code}>
              <tr
                key={`project-row-${project.project_code}`}
                className={`group hover:bg-gray-200 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'} transition`}
              >
                <td className="px-4 py-3 flex items-center gap-2 relative">
                  <button
                    onClick={() => toggleProject(project.project_code)}
                    onMouseEnter={() => setTooltipProject(project.project_code)}
                    onMouseLeave={() => setTooltipProject(null)}
                  >
                    <ChevronDown
                      className={`w-5 h-5 rounded-md transition-transform duration-200 hover:bg-gray-300
                    ${expandedProjects[project.project_code] ? 'rotate-360 text-gray-900' : '-rotate-90 text-gray-300'}
                    group-hover:text-gray-900`}
                    />
                  </button>
                  {tooltipProject === project.project_code && (
                    <div
                      className="absolute left-10 top-1/2 -translate-y-1/2 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-xs opacity-100 transition-opacity z-50"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {expandedProjects[project.project_code] ? 'Hide project stages' : 'Show project stages'}
                    </div>
                  )}
                  {/* <span>{renderCell(project, 'project_name')}</span> */}
                  <span>{project.project_name}</span>
                </td>
                <td className="px-4 py-2">
                  <span className="flex">
                    {project.project_code}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {auth_user && auth_user.role_id === 3 ? (
                    <div className="flex items-center">
                      {staff && staff.profile ? (
                        <img className="w-7 h-7 rounded-full" src={`data:image/png;base64,${staff.profile}`} alt="User" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-950 font-bold text-xs">{initials}</span>
                        </div>
                      )}
                      <div className="ps-3">
                        {editingOwnerProject === project.project_code ? (
                          <select
                            name="owner_id"
                            className="w-full px-3 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                            value={editOwnerId}
                            autoFocus
                            onBlur={() => setEditingOwnerProject(null)}
                            onChange={e => {
                              handleEditOwnerChange(project.project_code, e);
                              setEditingOwnerProject(null);
                            }}
                          >
                            <option value="" className="text-gray-600" disabled>Select Staff</option>
                            {staffs
                              .filter(staff => [2, 3].includes(staff.role_id))
                              .map(staff => (
                                <option key={staff.id} value={staff.id}>
                                  {staff.name || staff.email}
                                </option>
                              ))}
                          </select>
                        ) : (
                          renderCell(project, 'owner_id')
                        )}
                      </div>
                    </div>
                  ) : (

                    <div className="flex items-center">
                      {staff && staff.id ? (
                        <>
                          {staff.profile ? (
                            <img className="w-7 h-7 rounded-full mr-2" src={`data:image/png;base64,${staff.profile}`} alt="User" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                              <span className="text-gray-950 font-bold text-xs">{initials}</span>
                            </div>
                          )}
                          <span>{staff.name || staff.email || ''}</span>
                        </>
                      ) : (
                        <span className="italic text-gray-500">No project owner</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2"><span className="flex">{project.studio}</span></td>
                {/* <td className="px-4 py-2"><span className="flex">{renderCell(project, 'studio')}</span></td> */}
                <td className="px-4 py-2">
                  <span className="flex">
                    {String(project.project_status).toLowerCase() === 'null' ? '' : project.project_status}
                  </span>
                </td>
                {/* <td className="px-4 py-2"><span className="flex">{renderCell(project, 'project_status')}</span></td> */}
                {/* <td className="px-4 py-2">
                  <button
                    className="text-red-200 hover:text-red-700"
                    title="Delete Project"
                    onClick={() => handleDeleteProject(project.id, project.project_code)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td> */}
              </tr>

              {expandedProjects[project.project_code] && (
                <tr key={`expanded-row-${project.project_code}`}>
                  <td colSpan={HEADERS.length + 1} className="p-4">
                    <div className="bg-white border border-gray-300 rounded-b-lg overflow-x-auto mt-[-1px]">
                      <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-gray-800">
                          Project Stages for: <span className="font-bold">{project.project_name}</span>
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-gray-700">
                          <thead id={`stage-header-${project.project_code}`} className={`bg-gray-200 text-xs font-semibold h-10 z-20 ${activeStickyHeader === project.project_code ? 'sticky top-0' : ''}`}>
                            <tr>
                              {STAGE_HEADERS.map(header => (
                                <th
                                  key={header.key}
                                  className="cursor-pointer p-4"
                                  onClick={() => handleStageSort(project.project_code, header.key)}
                                >
                                  <div className="flex items-center">
                                    {header.label} {renderStageSortIndicator(project.project_code, header.key)}
                                  </div>
                                </th>
                              ))}
                              <th className="p-4"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedStages.map(stage => {
                              const stageId = stage.id || stage.stage_name;
                              return (
                                <tr key={`stage-row-${project.project_code}-${stageId}`}>
                                  <td className="px-4 py-2">{stage.stage_name}</td>
                                  <td className="px-4 py-2">{stage.start_date}</td>
                                  <td className="px-4 py-2">{stage.end_date}</td>
                                  {/* <td className="px-4 py-2">{renderStageCell(stage, project.project_code, 'stage_name')}</td>
                                  <td className="px-4 py-2">{renderStageCell(stage, project.project_code, 'start_date')}</td>
                                  <td className="px-4 py-2">{renderStageCell(stage, project.project_code, 'end_date')}</td>
                                  <td className="px-4 py-2">
                                    <button
                                      className="text-muted hover:text-muted"
                                      title="Delete Stage"
                                      onClick={() => handleDeleteStage(stageId, project.project_code)}
                                    >
                                      <SquareX className="w-5 h-5" />
                                    </button>
                                  </td> */}
                                </tr>
                              );
                            })}
                            {/* <tr key={`new-stage-row-${project.project_code}`}>
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  name="stage_name"
                                  placeholder="Stage Name"
                                  className="w-full px-3 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                                  value={newStage[project.project_code]?.stage_name || ''}
                                  onChange={e => handleNewStageChange(project.project_code, e)}
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="date"
                                  name="start_date"
                                  className="w-full px-3 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                                  value={newStage[project.project_code]?.start_date || ''}
                                  onChange={e => handleNewStageChange(project.project_code, e)}
                                />
                              </td>
                              <td className="px-4 py-2 flex items-center">
                                <input
                                  type="date"
                                  name="end_date"
                                  className="w-full px-3 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                                  value={newStage[project.project_code]?.end_date || ''}
                                  onChange={e => handleNewStageChange(project.project_code, e)}
                                />
                                <button
                                  className="ml-2 px-6 py-1 bg-primary text-white border rounded-full"
                                  onClick={e => handleAddStage(project.project_code, e)}
                                >
                                  Add
                                </button>
                              </td>
                              <td className="px-4 py-2"></td>
                            </tr> */}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
        {/* <tr key="new-project-row">
          <td className="px-4 py-2">
            <input
              type="text"
              name="project_name"
              placeholder="Project Name"
              className="w-full px-3 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
              value={newProject.project_name}
              onChange={handleNewProjectChange}
            />
          </td>
          <td className="px-4 py-2">
            <input
              type="text"
              name="project_code"
              placeholder="Project Code"
              className="w-full px-3 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
              value={newProject.project_code}
              onChange={handleNewProjectChange}
            />
          </td>
          <td className="px-4 py-2">
            <div className="flex items-center">
              {(() => {
                const staff = staffs.find(s => String(s.id) === String(selectedOwner));
                const initials = getStaffInitials(staff);
                if (staff && staff.profile) {
                  return (
                    <img className="w-7 h-7 rounded-full mr-2" src={`data:image/png;base64,${staff.profile}`} alt="User" />
                  );
                }
                if (selectedOwner) {
                  return (
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                      <span className="text-gray-950 font-bold text-xs">{initials}</span>
                    </div>
                  );
                }
                return (
                  <div />
                );
              })()}
              <select
                name="owner_id"
                className="w-full px-3 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                value={newProject.owner_id}
                onChange={handleOwnerChange}
              >
                <option value="" className="text-gray-600" disabled>Select Staff</option>
                {staffs
                  .filter(staff => [2, 3].includes(staff.role_id))
                  .map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name || staff.email}
                    </option>
                  ))}
              </select>
            </div>
          </td>
          <td className="px-4 py-2 flex items-center">
            <select
              name="studio"
              className="w-full px-3 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
              value={newProject.studio}
              onChange={handleNewProjectChange}
            >
              <option value="" className="text-gray-600" disabled>Select Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
            <button
              className="ml-2 px-6 py-1 bg-primary text-white border rounded-full"
              onClick={handleAddProject}
            >
              Add
            </button>
          </td>
        </tr> */}
      </tbody>
    </table>
  );
};

export default ProjectsTable;
