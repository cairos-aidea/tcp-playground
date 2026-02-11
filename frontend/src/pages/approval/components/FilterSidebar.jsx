import { useEffect, useState, useMemo } from 'react';
import { Filter } from 'lucide-react';
import Select from 'react-select';
import { useAppData } from '../../../context/AppDataContext';

const FilterSidebar = ({
  filter,
  setFilter,
  projects,
  projectStages,
  applyFilter,
  resetFilter,
}) => {
  const {
    projectsOwnedByUser,
    auth_user,
    fetchProjectsOwnedByUser
  } = useAppData();
  
  const [availableStages, setAvailableStages] = useState([]);

  // Filter projects based on time_charge_type
  const filteredProjects = useMemo(() => {
    if (!projectsOwnedByUser) return [];
    const type = filter.time_charge_type;
    if (type === '1') {
      // Projects External
      return Array.isArray(projectsOwnedByUser.projects_external) ? projectsOwnedByUser.projects_external : [];
    } else if (type === '2') {
      // Projects Internal
      return Array.isArray(projectsOwnedByUser.projects_internal) ? projectsOwnedByUser.projects_internal : [];
    } else if (type === '3') {
      // Departmental Tasks
      return Array.isArray(projectsOwnedByUser.departmental_tasks) ? projectsOwnedByUser.departmental_tasks : [];
    } else {
      // All types
      // Optionally, you could merge all projects arrays if needed
      return [];
    }
  }, [projectsOwnedByUser, filter.time_charge_type]);

  // Filter staffs based on time_charge_type
  const filteredStaffs = useMemo(() => {
    if (!projectsOwnedByUser || !Array.isArray(projectsOwnedByUser.time_charge_users)) return [];
    const type = filter.time_charge_type;
    let staffs = [];
    if (type === '1') {
      // Projects External: staffs with 1 in time_charges_filed
      staffs = projectsOwnedByUser.time_charge_users.filter(staff => Array.isArray(staff.time_charges_filed) && staff.time_charges_filed.includes(1));
    } else if (type === '2') {
      // Projects Internal: staffs with 2 in time_charges_filed
      staffs = projectsOwnedByUser.time_charge_users.filter(staff => Array.isArray(staff.time_charges_filed) && staff.time_charges_filed.includes(2));
    } else if (type === '3') {
      // Departmental Tasks: staffs with 3 in time_charges_filed
      staffs = projectsOwnedByUser.time_charge_users.filter(staff => Array.isArray(staff.time_charges_filed) && staff.time_charges_filed.includes(3));
    } else {
      // All types: all staffs
      staffs = projectsOwnedByUser.time_charge_users;
    }

    // Group by department
    const deptMap = new Map();
    // Helper to get initials
    const getInitials = (name) => {
      if (!name) return '?';
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0][0].toUpperCase();
      if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return '?';
    };

    staffs.forEach(staff => {
      // Use staff.department if available, else 'Unknown'
      const department = staff.department?.name || staff.department || 'Unknown';
      if (!deptMap.has(department)) {
        deptMap.set(department, []);
      }
      const initials = getInitials(staff.name);
      deptMap.get(department).push({
        value: staff.id,
        label: (
          <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            {staff.profile ? (
              <img
                src={`data:image/png;base64,${staff.profile}`}
                alt={staff.name}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginRight: 4,
                  background: '#e5e7eb',
                }}
              />
            ) : (
              <span style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#e5e7eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: '#374151',
                fontWeight: 600,
                marginRight: 4,
              }}>
                {initials}
              </span>
            )}
            {`${staff.name}`}
          </span>
        )
      });
    });

    // Sort each group by last name ascending
    const getLastName = (name) => {
      if (!name) return '';
      if (typeof name === 'string') {
        const parts = name.trim().split(' ');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : parts[0].toLowerCase();
      }
      if (name && name.props && name.props.children) {
        const children = Array.isArray(name.props.children) ? name.props.children : [name.props.children];
        const nameStr = children.filter((c) => typeof c === 'string').join(' ').trim();
        if (!nameStr) return '';
        const parts = nameStr.split(' ');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : parts[0].toLowerCase();
      }
      return '';
    };
    deptMap.forEach((staffArr, dept) => {
      staffArr.sort((a, b) => {
        const aLast = getLastName(a.label);
        const bLast = getLastName(b.label);
        if (aLast < bLast) return -1;
        if (aLast > bLast) return 1;
        return 0;
      });
    });

    // Sort departments: auth_user's department first, then alphabetically
    const userDept = auth_user?.department?.name || 'Unknown';
    const allDepts = Array.from(deptMap.keys());
    const sortedDepts = [
      ...allDepts.filter(dept => dept === userDept),
      ...allDepts.filter(dept => dept !== userDept).sort()
    ];

    // Format for react-select grouped options
    // Remove group label, but retain clickable synthetic option for group selection
    return sortedDepts.map(dept => {
      const staffOptions = deptMap.get(dept);
      return {
        options: [
          {
            value: `__group__${dept}`,
            label: <span style={{fontWeight:600, fontSize:13}}>{dept}</span>,
            options: staffOptions
          },
          ...staffOptions
        ]
      };
    });
  }, [projectsOwnedByUser, filter.time_charge_type, auth_user]);

  useEffect(() => {
    if (auth_user?.id) {
      fetchProjectsOwnedByUser(auth_user.id);
    }
  }, []);

  // Update available stages when project selection changes
  useEffect(() => {
    if (filter.project_id) {
      const selectedProject = projects.find(
        (p) => Number(p.id) === Number(filter.project_id)
      );
      if (selectedProject) {
        const filteredStages = projectStages.filter(
          (stage) => stage.project_code === selectedProject.project_code
        );
        setAvailableStages(filteredStages);
      }
    } else {
      setAvailableStages([]);
    }

    // fetchProjectsOwnedByUser(auth_user.id);
  }, [filter.project_id, projects, projectStages]);

  const handleFilterChange = (name, value) => {
    if (name === 'project_id') {
      setFilter({
        ...filter,
        [name]: value,
        stage_id: null,
      });
    } else if (name === 'time_charge_type') {
      setFilter({
        ...filter,
        [name]: value,
        staff_ids: [],
        project_id: '',
        stage_id: null,
        task_name: '',
      });
    } else {
      setFilter({
        ...filter,
        [name]: value,
      });
    }
  };

  const statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'declined', label: 'Declined' },
  ];

  return (
    <div className="bg-white z-50 p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center space-x-2">
          <Filter size={18} />
          <span>Filters</span>
        </h2>
      </div>

      <div className="space-y-4">
        {/* Date Range */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Date Range</h3>
          <div className="space-y-2">
            <div>
              <label htmlFor="start_date" className="text-sm">From</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={filter.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className={`w-full rounded p-2 text-sm text-gray-700 placeholder:text-gray-400 border border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400`}
              />
            </div>
            <div>
              <label htmlFor="end_date" className="text-sm">To</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={filter.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className={`w-full rounded p-2 text-sm text-gray-700 placeholder:text-gray-400 border border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400`}
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Status</h3>
          <Select
            options={statuses}
            value={statuses.find((s) => s.value === filter.status) || statuses[0]}
            onChange={(selected) => handleFilterChange('status', selected.value)}
            className="text-sm w-full"
            placeholder="Select status"
          // isClearable
          />
        </div>

        {/* Overtime Checkbox */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Overtime</h3>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_ot"
              name="is_ot"
              checked={filter.is_ot}
              onChange={(e) => handleFilterChange('is_ot', e.target.checked)}
              className="h-4 w-4 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="is_ot" className="text-sm">Show only overtime charges</label>
          </div>
        </div>

        <div className="space-y-2 border-t border-1 border-gray-400 pt-4">
          <h3 className="text-sm font-medium">Time Charge Type</h3>
          <Select
            options={[
              { value: '0', label: 'All Types' },
              { value: '1', label: 'Projects External' },
              { value: '2', label: 'Projects Internal' },
              { value: '3', label: 'Departmental Tasks' },
            ]}
            value={
              [
                { value: '', label: 'All Types' },
                { value: '1', label: 'Projects External' },
                { value: '2', label: 'Projects Internal' },
                { value: '3', label: 'Departmental Tasks' },
              ].find(opt => opt.value === filter.time_charge_type) || { value: '', label: 'All Types' }
            }
            onChange={selected =>
              handleFilterChange('time_charge_type', selected ? selected.value : '')
            }
            placeholder="Select Time Charge Type"
            className="text-sm w-full"
            isClearable
          />
        </div>

        {/* Show Staff selector automatically after first page load */}
        {(filter.time_charge_type === '0' || filter.time_charge_type === '' || filter.time_charge_type == null) && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Staff</h3>
            <Select
              options={filteredStaffs}
              value={
                Array.isArray(filter.staff_ids)
                  ? filteredStaffs.flatMap(group => group.options).filter(opt => filter.staff_ids.includes(opt.value))
                  : []
              }
              onChange={(selected, action) => {
                if (action.action === 'select-option' && action.option && action.option.options) {
                  // Group selected
                  const allIds = action.option.options.map(opt => opt.value);
                  setFilter({
                    ...filter,
                    staff_ids: Array.from(new Set([...(filter.staff_ids || []), ...allIds]))
                  });
                } else {
                  setFilter({
                    ...filter,
                    staff_ids: selected ? selected.map(opt => opt.value) : []
                  });
                }
              }}
              placeholder="Select Staff(s) or Department"
              className="text-sm w-full"
              isSearchable
              isClearable
              isMulti
              menuPlacement="top"
              autoFocus
              closeMenuOnSelect={false}
            />
          </div>
        )}

        {filter.time_charge_type === '1' && (
          <>
            {/* Projects External: Show Project, Stage, Staff */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Project</h3>
              <Select
                options={filteredProjects.map((p) => ({
                  value: p.id,
                  label: `${p.project_code} - ${p.project_name}`,
                }))}
                value={
                  filteredProjects
                    .map((p) => ({
                      value: p.id,
                      label: `${p.project_code} - ${p.project_name}`,
                    }))
                    .find((opt) => opt.value === filter.project_id) || null
                }
                onChange={(selected) => {
                  const selectedProject = filteredProjects.find((p) => p.id === selected?.value);
                  setFilter({
                    ...filter,
                    project_id: selected ? selected.value : '',
                    project_code: selectedProject ? selectedProject.project_code : '',
                    project_name: selectedProject ? selectedProject.project_name : '',
                    stage_id: null,
                  });
                }}
                className="text-sm w-full"
                placeholder="Select project"
                maxMenuHeight={200}
                isClearable
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Project Stage</h3>
              <Select
                options={availableStages.map((s) => ({
                  value: s.id,
                  label: s.stage_name,
                }))}
                value={
                  availableStages
                    .map((s) => ({ value: s.id, label: s.stage_name }))
                    .find((opt) => opt.value === filter.stage_id) || null
                }
                onChange={(selected) =>
                  handleFilterChange('stage_id', selected ? selected.value : '')
                }
                placeholder="Select Stage"
                isDisabled={!filter.project_id}
                className="text-sm w-full"
                isClearable
                menuPlacement="top"
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Staff</h3>
              <Select
                options={filteredStaffs}
                value={
                  Array.isArray(filter.staff_ids)
                    ? filteredStaffs.flatMap(group => group.options).filter(opt => filter.staff_ids.includes(opt.value))
                    : []
                }
                onChange={(selected, action) => {
                  if (action.action === 'select-option' && action.option && action.option.options) {
                    const allIds = action.option.options.map(opt => opt.value);
                    setFilter({
                      ...filter,
                      staff_ids: Array.from(new Set([...(filter.staff_ids || []), ...allIds]))
                    });
                  } else {
                    setFilter({
                      ...filter,
                      staff_ids: selected ? selected.map(opt => opt.value) : []
                    });
                  }
                }}
                placeholder="Select Staff(s) or Department"
                className="text-sm w-full"
                isSearchable
                isClearable
                isMulti
                menuPlacement="top"
                closeMenuOnSelect={false}
              />
            </div>
          </>
        )}

        {filter.time_charge_type === '2' && (
          <>
            {/* Projects Internal: Show Project and Staff */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Project</h3>
              <Select
                options={filteredProjects.map((p) => ({
                  value: p.id,
                  label: `${p.project_code} - ${p.project_name}`,
                }))}
                value={
                  filteredProjects
                    .map((p) => ({
                      value: p.id,
                      label: `${p.project_code} - ${p.project_name}`,
                    }))
                    .find((opt) => opt.value === filter.project_id) || null
                }
                onChange={(selected) => {
                  const selectedProject = filteredProjects.find((p) => p.id === selected?.value);
                  setFilter({
                    ...filter,
                    project_id: selected ? selected.value : '',
                    project_code: selectedProject ? selectedProject.project_code : '',
                    project_name: selectedProject ? selectedProject.project_name : '',
                  });
                }}
                className="text-sm w-full"
                placeholder="Select project"
                maxMenuHeight={200}
                isClearable
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Staff</h3>
              <Select
                options={filteredStaffs}
                value={
                  Array.isArray(filter.staff_ids)
                    ? filteredStaffs.flatMap(group => group.options).filter(opt => filter.staff_ids.includes(opt.value))
                    : []
                }
                onChange={(selected, action) => {
                  if (action.action === 'select-option' && action.option && action.option.options) {
                    const allIds = action.option.options.map(opt => opt.value);
                    setFilter({
                      ...filter,
                      staff_ids: Array.from(new Set([...(filter.staff_ids || []), ...allIds]))
                    });
                  } else {
                    setFilter({
                      ...filter,
                      staff_ids: selected ? selected.map(opt => opt.value) : []
                    });
                  }
                }}
                placeholder="Select Staff(s) or Department"
                className="text-sm w-full"
                isSearchable
                isClearable
                isMulti
                menuPlacement="top"
                closeMenuOnSelect={false}
              />
            </div>
          </>
        )}

        {filter.time_charge_type === '3' && (
          <>
            {/* Departmental Tasks: Show Task and Staff */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Task</h3>
              <Select
                options={filteredProjects.map((t) => ({
                  value: t.id,
                  label: t.task_name || t.project_name || `Task ${t.id}`,
                }))}
                value={
                  filteredProjects
                    .map((t) => ({
                      value: t.id,
                      label: t.task_name || t.project_name || `Task ${t.id}`,
                    }))
                    .find((opt) => opt.value === filter.project_id) || null
                }
                onChange={(selected) => {
                  const selectedTask = filteredProjects.find((t) => t.id === selected?.value);
                  setFilter({
                    ...filter,
                    project_id: selected ? selected.value : '',
                    task_name: selectedTask ? (selectedTask.task_name || selectedTask.project_name) : '',
                  });
                }}
                className="text-sm w-full"
                placeholder="Select Task"
                maxMenuHeight={200}
                isClearable
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Staff</h3>
              <Select
                options={filteredStaffs}
                value={
                  Array.isArray(filter.staff_ids)
                    ? filteredStaffs.flatMap(group => group.options).filter(opt => filter.staff_ids.includes(opt.value))
                    : []
                }
                onChange={(selected, action) => {
                  if (action.action === 'select-option' && action.option && action.option.options) {
                    const allIds = action.option.options.map(opt => opt.value);
                    setFilter({
                      ...filter,
                      staff_ids: Array.from(new Set([...(filter.staff_ids || []), ...allIds]))
                    });
                  } else {
                    setFilter({
                      ...filter,
                      staff_ids: selected ? selected.map(opt => opt.value) : []
                    });
                  }
                }}
                placeholder="Select Staff(s) or Department"
                className="text-sm w-full"
                isSearchable
                isClearable
                isMulti
                menuPlacement="top"
                closeMenuOnSelect={false}
              />
            </div>
          </>
        )}
      </div>

      {/* Responsive Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <button
          className="w-full text-sm px-4 py-3 bg-primary text-white rounded-full hover:bg-primary-hover transition"
          onClick={applyFilter}
        >
          Apply Filters
        </button>
        <button
          className="w-full text-sm px-4 py-3 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 transition"
          onClick={resetFilter}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar;
