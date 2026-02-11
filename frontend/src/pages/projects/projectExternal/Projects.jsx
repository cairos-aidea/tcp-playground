import React, { useState, useEffect } from 'react';
import { api } from '../../../api/api';
import { errorNotification } from '../../../components/notifications/notifications';
import { useAppData } from '../../../context/AppDataContext';
import Search from '../../../components/navigations/Search';
import ProjectsTable from './components/ProjectsTable';
import Pagination from '../../../components/navigations/Pagination';
import ReactLoading from "react-loading";

const ITEMS_PER_PAGE = 15;

const Projects = () => {
  const {
    projects,
    setProjects,
    projectStages,
    setProjectStages,
    staffs,
    departments,
    isLoading,
    headerReq,
    auth_user
  } = useAppData();

  const [showFilter, setShowFilter] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [newProject, setNewProject] = useState({
    id: '',
    project_name: '',
    project_code: '',
    owner_id: '',
    studio: ''
  });

  const [newStage, setNewStage] = useState({});
  const [search, setSearch] = useState('');
  const [editingProjectCell, setEditingProjectCell] = useState(null);
  const [tempProjectValue, setTempProjectValue] = useState('');
  const [originalProjectValue, setOriginalProjectValue] = useState('');
  const [editingStageCell, setEditingStageCell] = useState(null);
  const [tempStageValue, setTempStageValue] = useState('');
  const [originalStageValue, setOriginalStageValue] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    document.title = "Projects External | Aidea Time Charging";
  }, []);

  // --- DELETE HANDLERS ---

  const handleDeleteProject = async (projectId, projectCode) => {
    if (!window.confirm(`Are you sure you want to delete this project This will also delete all its stages.`)) return;

    const apiPayload = generateApiPayload(projectId, "", "");
    try {
      await api('project_delete', { ...headerReq, id: projectId }, apiPayload);

      setProjects(prev => prev.filter(p => p.id !== projectId));
      setProjectStages(prev => prev.filter(s => s.project_code !== projectCode));
    } catch (error) {
      errorNotification({
        title: "Project Deletion Failed",
        message: error.message || "Something went wrong",
      }
      );
    }
  };

  const handleDeleteStage = async (stageId, projectCode) => {
    if (!window.confirm(`Are you sure you want to delete this stage?`))
      return;

    const apiPayload = generateApiPayload(stageId, "", "");

    try {
      await api('project_stage_delete', { ...headerReq, id: stageId }, apiPayload);
      setProjectStages(prev => prev.filter(
        s => (s.id || s.stage_name) !== stageId || s.project_code !== projectCode
      ));
    } catch (error) {
      errorNotification({
        title: "Stage Deletion Failed",
        message: "Something went wrong. Try again.",
      }
      );
    }
  };

  // --- Project management ---

  const toggleProject = (projectCode) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectCode]: !prev[projectCode],
    }));
  };

  const getStagesForProject = (projectCode) => {
    return projectStages.filter(stage => stage.project_code === projectCode);
  };

  const generateApiPayload = (id, field, value) => {
    return {
      id: id,
      field: field,
      value: value,
    };
  };

  // --- Project editing handlers ---
  const handleProjectEditStart = (projectId, field, currentValue) => {
    setEditingProjectCell({ projectId, field });
    setTempProjectValue(currentValue);
    setOriginalProjectValue(currentValue);
  };

  const handleProjectEditChange = (e) => {
    setTempProjectValue(e.target.value);
    // console.log("Project edit change:", e.target.value);
  };

  const handleProjectEditSubmit = (projectId, field) => {
    if (tempProjectValue === null || tempProjectValue === undefined || tempProjectValue === '') {
      // errorNotification({
      //   title: "Edit Failed",
      //   message: "Value cannot be empty.",
      // });
      setEditingProjectCell(null);
      setTempProjectValue('');
      return;
    }

    if (field === 'project_code' && projects.some(p => p.project_code === tempProjectValue && p.id !== projectId)) {
      errorNotification({
        title: "Edit Failed",
        message: "Project code already exists.",
      });

      setEditingProjectCell(null);
      setTempProjectValue('');
      return;
    }

    if (tempProjectValue === originalProjectValue) {
      setEditingProjectCell(null);
      setTempProjectValue('');
      return;
    }

    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return { ...project, [field]: tempProjectValue };
      }
      return project;
    });

    setProjects(updatedProjects);
    setEditingProjectCell(null);
    setTempProjectValue('');

    const apiPayload = generateApiPayload(projectId, field, tempProjectValue);
    api("project_update", { ...headerReq, id: projectId }, apiPayload)
      .catch((error) => {
        // errorNotification({
        //   title: "Project Update Failed",
        //   message: "Something went wrong. Try again.",
        // });
      }
      );
  };

  const handleKeyDown = (e, projectId, field) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      handleProjectEditSubmit(projectId, field);
    }
  };

  // --- Stage editing handlers ---

  const handleStageEditStart = (projectCode, stageId, field, currentValue) => {
    setEditingStageCell({ projectCode, stageId, field });
    setTempStageValue(currentValue === null || currentValue === undefined ? '' : currentValue);
    setOriginalStageValue(currentValue);
  };

  const handleStageEditChange = (e) => {
    setTempStageValue(e.target.value);
  };

  const handleStageEditSubmit = (projectCode, stageId, field) => {
    if (field !== 'description' && (tempStageValue === null || tempStageValue === undefined || tempStageValue === '')) {
      errorNotification({
        title: "Edit Failed",
        message: "Value cannot be empty.",
      });
      setEditingStageCell(null);
      setTempStageValue('');
      return;
    }

    if (tempStageValue === originalStageValue) {
      setEditingStageCell(null);
      setTempStageValue('');
      return;
    }

    const updatedStages = projectStages.map(stage => {
      if ((stage.id || stage.stage_name) === stageId && stage.project_code === projectCode) {
        return { ...stage, [field]: field === 'description' && tempStageValue === '' ? null : tempStageValue };
      }
      return stage;
    });

    setProjectStages(updatedStages);
    setEditingStageCell(null);
    setTempStageValue('');

    const apiPayload = generateApiPayload(stageId, field, tempStageValue);
    api("project_stage_update", { ...headerReq, id: stageId }, apiPayload)
      .catch((error) => {
        errorNotification({
          title: "Project Stage Update Failed",
          message: "Something went wrong. Try again.",
        });
      }
      );
  };

  const handleStageKeyDown = (e, projectCode, stageId, field) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      handleStageEditSubmit(projectCode, stageId, field);
    }
  };

  // --- New project/stage handlers ---

  const handleNewProjectChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    const { id, project_name, project_code, owner_id, studio } = newProject;

    if (!project_name || !project_code || !owner_id || !studio) {
      // console.log("All fields are required.");
      return;
    }

    if (projects.some(p => p.project_code === project_code)) {
      // console.log('Project code already exists');
      return;
    }

    const owner = staffs.find(staff => staff.id === Number(owner_id));
    const ownerName = owner ? (owner.name || owner.username || owner.email) : '';

    const updatedProject = {
      ...newProject,
      owner_id: Number(owner_id),
      owner_name: ownerName,
      project_status: 'active'
    };

    api("project_create", headerReq, updatedProject)
      .then((res) => {
        // console.log('Project created successfully', res);
        const newProjects = [...projects, { ...newProject, id: res.id, project_status: 'active' }];
        setProjects(newProjects);
        setNewProject({ id: '', project_name: '', project_code: '', owner_id: '', studio: '', project_status: 'active' });

        // Go to the page where the new project appears
        const filtered = getFilteredProjects();
        const newIndex = filtered.findIndex(p => p.id === res.id);
        if (newIndex !== -1) {
          const newPage = Math.floor(newIndex / ITEMS_PER_PAGE) + 1;
          setCurrentPage(newPage);
        } else {
          // fallback: go to last page
          const total = Math.ceil(newProjects.length / ITEMS_PER_PAGE);
          setCurrentPage(total);
        }
      })
      .catch((error) => {
        errorNotification({
          title: "Project Creation Failed",
          message: "Something went wrong. Try again.",
        });
      }
      );
  };

  const handleNewStageChange = (projectCode, e) => {
    const { name, value } = e.target;
    setNewStage(prev => ({
      ...prev,
      [projectCode]: { ...(prev[projectCode] || {}), [name]: value }
    }));
  };

  const handleAddStage = async (projectCode, e) => {
    e.preventDefault();
    const stage = newStage[projectCode] || {};
    if (!stage.stage_name) {
      // console.log('Stage name is required');
      return;
    }
    if (stage.start_date && stage.end_date && stage.start_date > stage.end_date) {
      // console.log('Start date must be before or equal to close date');
      return;
    }

    api("project_stage_create", headerReq, { ...stage, project_code: projectCode })
      .then((res) => {
        // console.log('Stage created successfully', res);
        setProjectStages([...projectStages, { ...stage, project_code: projectCode, id: res.id, }]);
        setNewStage(prev => ({
          ...prev,
          [projectCode]: { id: res.id, stage_name: '', description: '', start_date: '', end_date: '' }
        }));
      })
      .catch((error) => {
        errorNotification({
          title: "Project Stage Creation Failed",
          message: "Something went wrong. Try again.",
        });
      }
      );
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const getFilteredProjects = () => {
    if (!search.trim()) return projects;
    const lower = search.toLowerCase();
    return projects.filter(
      p =>
        (p.project_name && p.project_name.toLowerCase().includes(lower)) ||
        (p.project_code && p.project_code.toLowerCase().includes(lower))
    );
  };

  const renderCell = (project, field) => {
    if (editingProjectCell && editingProjectCell.projectId === project.id && editingProjectCell.field === field) {
      if (field === 'owner_id') {
        return (
          <select
            value={tempProjectValue}
            onChange={handleProjectEditChange}
            onBlur={() => handleProjectEditSubmit(project.id, field)}
            onKeyDown={(e) => handleKeyDown(e, project.id, field)}
            autoFocus
            className="px-3 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary border border-transparent hover:border-gray-300 cursor-pointer"
          >
            <option value="">Select Staff</option>
            {staffs
              .filter(staff => [2, 3].includes(staff.role_id))
              .map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.name || staff.username || staff.email}
                </option>
              ))}
          </select>
        );
      }
      if (field === 'studio') {
        return (
          <select
            value={tempProjectValue}
            onChange={handleProjectEditChange}
            onBlur={() => handleProjectEditSubmit(project.id, field)}
            onKeyDown={(e) => handleKeyDown(e, project.id, field)}
            autoFocus
            className="px-3 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary border border-transparent hover:border-gray-300 cursor-pointer"
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        );
      }
      if (field === 'project_status') {
        return (
          <select
            value={tempProjectValue}
            onChange={handleProjectEditChange}
            onBlur={() => handleProjectEditSubmit(project.id, field)}
            onKeyDown={(e) => handleKeyDown(e, project.id, field)}
            autoFocus
            className="px-3 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary border border-transparent hover:border-gray-300 cursor-pointer"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="completed">Completed</option>
          </select>
        );
      }
      return (
        <input
          type="text"
          value={tempProjectValue}
          onChange={handleProjectEditChange}
          onBlur={() => handleProjectEditSubmit(project.id, field)}
          onKeyDown={(e) => handleKeyDown(e, project.id, field)}
          autoFocus
          className="w-full px-3 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary border border-transparent hover:border-gray-300 cursor-text"
        />
      );
    }
    if (field === 'owner_id') {
      const owner = staffs.find(staff => staff.id === Number(project.owner_id));
      return (
        <div
          onClick={() => {
        handleProjectEditStart(project.id, field, project.owner_id);
          }}
        >
          {owner ? (owner.name || owner.email) : <span className="italic text-gray-500">No project owner</span>}
        </div>
      );
    }
    if (field === 'studio') {
      return (
        <div
          className="px-3 py-1 rounded-full focus:ring-2 focus:ring-primary border border-transparent hover:border-gray-300 focus:outline-none cursor-pointer"
          onClick={() => handleProjectEditStart(project.id, field, project.studio)}
        >
          {project.studio}
        </div>
      );
    }
    if (field === 'project_status') {
      return (
        <div
          className="px-3 py-1 rounded-full focus:ring-2 focus:ring-primary border border-transparent hover:border-gray-300 focus:outline-none cursor-pointer"
          onClick={() => handleProjectEditStart(project.id, field, project.project_status)}
        >
          {project.project_status}
        </div>
      );
    }
    return (
      <div
        className="px-3 py-1 rounded-full focus:ring-2 focus:ring-primary border border-transparent hover:border-gray-300 focus:outline-none cursor-text"
        onClick={() => handleProjectEditStart(project.id, field, project[field] || '')}
      >
        {project[field]}
      </div>
    );
  };

  const renderStageCell = (stage, projectCode, field) => {
    const stageId = stage.id || stage.stage_name;
    if (
      editingStageCell &&
      editingStageCell.projectCode === projectCode &&
      editingStageCell.stageId === stageId &&
      editingStageCell.field === field
    ) {
      if (field === 'start_date' || field === 'end_date') {
        return (
          <input
            type="date"
            value={tempStageValue || ''}
            onChange={handleStageEditChange}
            onBlur={() => handleStageEditSubmit(projectCode, stageId, field)}
            onKeyDown={(e) => handleStageKeyDown(e, projectCode, stageId, field)}
            autoFocus
            className="px-3 py-1 rounded-full focus:ring-2 focus:ring-primary border border-transparent hover:border-gray-300 focus:outline-none cursor-pointer"
          />
        );
      }
      if (field === 'description') {
        return (
          <input
            type="text"
            value={tempStageValue}
            onChange={handleStageEditChange}
            onBlur={() => handleStageEditSubmit(projectCode, stageId, field)}
            onKeyDown={(e) => handleStageKeyDown(e, projectCode, stageId, field)}
            autoFocus
            className="w-full border px-2 py-1"
            placeholder="(Optional)"
          />
        );
      }
      return (
        <input
          type="text"
          value={tempStageValue}
          onChange={handleStageEditChange}
          onBlur={() => handleStageEditSubmit(projectCode, stageId, field)}
          onKeyDown={(e) => handleStageKeyDown(e, projectCode, stageId, field)}
          autoFocus
          className="px-3 py-1 rounded-full focus:ring-2 focus:ring-primary border border-transparent hover:border-gray-300 focus:outline-none cursor-pointer"
        />
      );
    }
    if (field === 'description') {
      return (
        <div
          className="px-3 py-1 rounded-full focus:ring-2 focus:ring-primary border border-transparent hover:border-gray-300 focus:outline-none cursor-text"
          onClick={() =>
            handleStageEditStart(
              projectCode,
              stageId,
              field,
              stage[field] === null || stage[field] === undefined ? '' : stage[field]
            )
          }
        >
          {stage[field] === null || stage[field] === undefined ? '' : stage[field]}
        </div>
      );
    }
    return (
      <div
        className="px-3 py-1 rounded-full focus:ring-2 focus:ring-primary border border-transparent hover:border-gray-300 focus:outline-none cursor-text"
        onClick={() =>
          handleStageEditStart(
            projectCode,
            stageId,
            field,
            stage[field] || ''
          )
        }
      >
        {stage[field]}
      </div>
    );
  };

  const filteredProjects = getFilteredProjects();
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    // If filtering reduces the number of pages, reset to first page if needed
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filteredProjects, totalPages, currentPage]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="container-fluid h-full">
        <div className="w-full sticky top-0 bg-white flex justify-between items-center border-b p-3 z-10">
          <h1 className="text-xl font-semibold text-gray-700">Projects External</h1>
          <Search
            value={search}
            onChange={handleSearchChange}
            placeholder="Search project"
          />

          {/* <button
          className="px-3 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          title="Filter"
          onClick={() => setShowFilter(!showFilter)}
        >
          <Filter size={18} />
        </button> */}
        </div>

        <div className="grid grid-cols-12 h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="col-span-12 overflow-x-auto h-full flex flex-col">
            {isLoading ? (
              <div className="flex items-center justify-center h-screen bg-gray-100">
                <ReactLoading type="bars" color="#888888" height={50} width={50} />
              </div>
            ) : (
              <div className="col-span-12 overflow-auto h-full flex flex-col pb-16 sm:pb-0">
                <ProjectsTable
                  filteredProjects={paginatedProjects}
                  expandedProjects={expandedProjects}
                  toggleProject={toggleProject}
                  getStagesForProject={getStagesForProject}
                  renderCell={renderCell}
                  renderStageCell={renderStageCell}
                  handleDeleteProject={handleDeleteProject}
                  handleDeleteStage={handleDeleteStage}
                  handleNewStageChange={handleNewStageChange}
                  handleAddStage={handleAddStage}
                  newStage={newStage}
                  newProject={newProject}
                  handleNewProjectChange={handleNewProjectChange}
                  handleAddProject={handleAddProject}
                  staffs={staffs}
                  departments={departments}
                  auth_user={auth_user}
                />
              </div>
            )}
          </div>
        </div>
        
        <div
          className="w-full sticky bottom-0 bg-white flex justify-center items-center border-t p-3 pb-20 sm:pb-3 z-10"
        >
          <Pagination
            currentPage={currentPage}
            lastPage={totalPages}
            totalPages={totalPages}
            totalRecords={filteredProjects.length}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Projects;