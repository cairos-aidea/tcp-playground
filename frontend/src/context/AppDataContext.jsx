import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/api';
import { db } from '../utilities/database/db';

const AppDataContext = createContext();

export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
  const token = localStorage.getItem("auth_accessToken");
  const auth_user_data = JSON.parse(localStorage.getItem("auth_user"));
  const headerReq = { token };

  const [projects, setProjects] = useState([]);
  const [projectsOwnedByUser, setProjectsOwnedByUser] = useState([]);
  const [projectStages, setProjectStages] = useState([]);
  const [projectsInternal, setProjectsInternal] = useState([]);
  const [departmentalTasks, setDepartmentalTasks] = useState([]);

  const [staffs, setStaffs] = useState([]);
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [holidaysCalendar, setHolidaysCalendar] = useState({ fixedHolidays: [], dynamicHolidays: [] });
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeCharges, setTimeCharges] = useState({ data: [] });

  const activities = ["Handover & Strategy Workshop", "Research & Design", "Visualization", "Modeling & Documentation", "Meetings & Coordination", "Quality Checking & Assurance", "Revision for Previous Stages"];
  const leaveTypes = ["Annual Leave", "Sick Leave", "Unpaid Leave"];
  const rankOrder = ["Vice President", "Senior Associate", "Manager 4", "Manager 3", "Manager 2", "Manager 1", "Expert 4", "Expert 3", "Expert 2", "Expert 1", "Intermediate", "Band 3", "Band 2", "Band 1"];

   const loadCached = async () => {
    const [
      cachedProjects,
      cachedStages,
      cachedInternal,
      cachedDeptTasks,
      cachedStaffs,
      cachedSubsidiaries,
      cachedDepartments
    ] = await Promise.all([
      db.projects.toArray(),
      db.projectStages.toArray(),
      db.projectsInternal.toArray(),
      db.departmentalTasks.toArray(),
      db.staffs.toArray(),
      db.subsidiaries.toArray(),
      db.departments.toArray()
    ]);

    if (cachedProjects.length) setProjects(cachedProjects);
    if (cachedStages.length) setProjectStages(cachedStages);
    if (cachedInternal.length) setProjectsInternal(cachedInternal);
    if (cachedDeptTasks.length) setDepartmentalTasks(cachedDeptTasks);
    if (cachedStaffs.length) setStaffs(cachedStaffs);
    if (cachedSubsidiaries.length) setSubsidiaries(cachedSubsidiaries);
    if (cachedDepartments.length) setDepartments(cachedDepartments);
  };

  const saveToCache = async (table, data) => {
    await db[table].clear();
    if (data?.length) await db[table].bulkAdd(data);
  };

  const fetchInitialData = async () => {
    setIsLoading(true);

    // 1. Immediately load cached data (fast UI)
    await loadCached();

    try {
      // 2. Fetch fresh data in background
      const [
        projectsData,
        stagesData,
        internalData,
        deptTasksData,
        staffsData,
        subsidiariesData,
        departmentsData
      ] = await Promise.all([
        api("projects", headerReq, null),
        api("project_stages", headerReq, null),
        api("project_internals", headerReq, null),
        api("departmental_tasks", headerReq, null),
        api("staffs_list", headerReq, null),
        api("subsidiaries", headerReq, null),
        api("departments_list", headerReq, null),
      ]);

      // 3. Update UI with fresh data
      setProjects(projectsData);
      setProjectStages(stagesData);
      setProjectsInternal(internalData);
      setDepartmentalTasks(deptTasksData);
      setStaffs(staffsData);
      setSubsidiaries(subsidiariesData);
      setDepartments(departmentsData);

      // 4. Store fresh data into IndexedDB
      saveToCache("projects", projectsData);
      saveToCache("projectStages", stagesData);
      saveToCache("projectsInternal", internalData);
      saveToCache("departmentalTasks", deptTasksData);
      saveToCache("staffs", staffsData);
      saveToCache("subsidiaries", subsidiariesData);
      saveToCache("departments", departmentsData);

    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffs = async () => {
    setIsLoading(true);
    try {
      const staffsData = await api("staffs_list", headerReq, null);
      setStaffs(staffsData);
      return staffsData;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  // const fetchInitialData = async () => {
  //   setIsLoading(true);
  //   try {
  //     const [projectsData, projectStagesData, projectsInternalData, departmentalTasksData, staffsData, subsidiariesData, departmentsData] = await Promise.all([
  //       api("projects", headerReq, null),
  //       api("project_stages", headerReq, null),
  //       api("project_internals", headerReq, null),
  //       api("departmental_tasks", headerReq, null),
  //       api("staffs_list", headerReq, null),    
  //       api("subsidiaries", headerReq, null),
  //       api("departments_list", headerReq, null)
  //     ]);
      
  //     setProjects(projectsData);  // project external
  //     setProjectStages(projectStagesData);
  //     setProjectsInternal(projectsInternalData);
  //     setDepartmentalTasks(departmentalTasksData);
  //     setStaffs(staffsData);
  //     setSubsidiaries(subsidiariesData);
  //     setDepartments(departmentsData);
      
  //   } catch (error) {
  //     // console.error('Error fetching data:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Fetch projects owned by user
  const fetchProjectsOwnedByUser = async (userId) => {
    setIsLoading(true);
    try {
      const projectsData = await api("projects_owned", { ...headerReq, id: userId });
      setProjectsOwnedByUser(projectsData);
      return projectsData;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch time charges for approver list
  const fetchApproversList = async (page = 1, filter = null, perPage = 25) => {
    setIsLoading(true);
    const headerParams = { ...headerReq, page, per_page: perPage };
    
    try {
      const result = await api("approvers_list", headerParams, filter);
      setTimeCharges(result);
      return result;
    } catch (error) {
      // console.error('Error fetching approval list:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch calendar data
  // const fetchCalendarData = async (startDate, endDate, year) => {
  //   setIsLoading(true);
  //   const headerParams = {
  //     ...headerReq, 
  //     year, 
  //     start_date: startDate, 
  //     end_date: endDate,
  //     user_id: auth_user_data.id
  //   };
    
  //   try {
  //     const [
  //       timeChargesData, 
  //       meetingsData, 
  //       holidaysData, 
  //       leavesData
  //     ] = await Promise.all([
  //       api("time_charges", headerParams, null),
  //       api("meeting_list", headerParams, null),
  //       api("holiday_calendar", headerParams, null),
  //       api("leave_list", headerParams, null)
  //     ]);

  //     setHolidaysCalendar(holidaysData);
  //     setLeaves(leavesData);
      
  //     return {
  //       timeCharges: timeChargesData,
  //       meetings: meetingsData,
  //       holidaysCalendar: holidaysData,
  //       leaves: leavesData
  //     };
  //   } catch (error) {
  //     // console.error('Error fetching calendar data:', error);
  //     throw error;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const fetchTimeCharges = async (year, month) => {
    setIsLoading(true);
    const headerParams = {
      ...headerReq,
      year: year,
      month: month,
      user_id: auth_user_data.id, 
    };

    try {
      const timeChargesData = await api("time_charges", headerParams, null);
      setTimeCharges(timeChargesData);
      return timeChargesData;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  const fetchMeetings = async (startDate, endDate, year) => {
    setIsLoading(true);
    const headerParams = {
      ...headerReq,
      year,
      start_date: startDate,
      end_date: endDate,
      user_id: auth_user_data.id,
    };
    try {
      const meetingsData = await api("meeting_list", headerParams, null);
      return meetingsData;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHolidays = async (startDate, endDate, year) => {
    setIsLoading(true);
    const headerParams = {
      ...headerReq,
      year,
      start_date: startDate,
      end_date: endDate,
      user_id: auth_user_data.id,
    };
    try {
      const holidaysData = await api("holiday_calendar", headerParams, null);
      setHolidaysCalendar(holidaysData);
      return holidaysData;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaves = async (startDate, endDate, year) => {
    setIsLoading(true);
    const headerParams = {
      ...headerReq,
      year,
      start_date: startDate,
      end_date: endDate,
      user_id: auth_user_data.id,
    };
    try {
      const leavesData = await api("leave_list", headerParams, null);
      setLeaves(leavesData);
      return leavesData;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCalendarData = async (
    startDate,
    endDate,
    year,
    options = { timeCharges: true, meetings: true, holidaysCalendar: true, leaves: true }
  ) => {
    setIsLoading(true);
    const headerParams = {
      ...headerReq,
      year,
      start_date: startDate,
      end_date: endDate,
      user_id: auth_user_data.id, 
    };

    try {
      const results = await Promise.all([
        options.timeCharges ? api("time_charges", headerParams, null) : Promise.resolve(null),
        options.meetings ? api("meeting_list", headerParams, null) : Promise.resolve(null),
        options.holidaysCalendar ? api("holiday_calendar", headerParams, null) : Promise.resolve(null),
        options.leaves ? api("leave_list", headerParams, null) : Promise.resolve(null),
      ]);

      const [timeChargesData, meetingsData, holidaysData, leavesData] = results;

      if (options.holidaysCalendar) setHolidaysCalendar(holidaysData);
      if (options.leaves) setLeaves(leavesData);

      return {
        timeCharges: timeChargesData,
        meetings: meetingsData,
        holidaysCalendar: holidaysData,
        leaves: leavesData,
      };
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOtherExpenses = async () => {
    setIsLoading(true);
    try {
      const otherExpensesData = await api("other_expenses", headerReq, null);
      return otherExpensesData;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (auth_user_data) {
      fetchInitialData();
    }
  }, []);

  // Values to be provided to consumers
  const value = {
    // Auth data
    auth_user: auth_user_data,
    token,

    projects,
    projectsOwnedByUser,
    projectStages,
    projectsInternal,
    setProjectsInternal,
    departmentalTasks,
    setDepartmentalTasks,

    staffs,
    setStaffs,
    fetchStaffs,

    subsidiaries,
    departments,
    setDepartments,

    timeCharges,
    holidaysCalendar,
    leaves,

    // Header request
    headerReq,
    
    // State
    isLoading,

    // Projects
    activities,
    leaveTypes,
    rankOrder,
    
    // Methods
    fetchInitialData,
    fetchApproversList,
    fetchCalendarData,
    fetchProjectsOwnedByUser,

    fetchTimeCharges,
    fetchMeetings,
    fetchHolidays,
    fetchLeaves,
    fetchOtherExpenses,
    
    // Setters
    setProjects,
    setProjectStages,
    setTimeCharges,
  };
  
  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

export default AppDataContext;