import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/api';
import { db } from '../utilities/database/db';
import {
  useProjects,
  useStaffs,
  useDepartments,
  useProjectStages,
  useProjectsInternal,
  useDepartmentalTasks
} from '../hooks/useReferenceData';

const AppDataContext = createContext();

export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
  const token = localStorage.getItem("auth_accessToken");
  const auth_user_data = JSON.parse(localStorage.getItem("auth_user"));
  const headerReq = { token };

  // --- React Query Hooks ---
  const { data: projects = [] } = useProjects();
  const { data: staffs = [] } = useStaffs();
  const { data: departments = [] } = useDepartments();
  const { data: projectStages = [] } = useProjectStages();
  const { data: projectsInternal = [], refetch: refetchProjectsInternal } = useProjectsInternal();
  const { data: departmentalTasks = [], refetch: refetchDeptTasks } = useDepartmentalTasks();

  // --- Local State (Legacy / Non-Global) ---
  const [projectsOwnedByUser, setProjectsOwnedByUser] = useState([]);
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [holidaysCalendar, setHolidaysCalendar] = useState({ fixedHolidays: [], dynamicHolidays: [] });
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Kept for legacy compatibility, though specific queries have their own loading states
  const [timeCharges, setTimeCharges] = useState({ data: [] }); // Legacy: ApprovalList will use hook directly, this might be unused soon

  const activities = ["Handover & Strategy Workshop", "Research & Design", "Visualization", "Modeling & Documentation", "Meetings & Coordination", "Quality Checking & Assurance", "Revision for Previous Stages"];
  const leaveTypes = ["Annual Leave", "Sick Leave", "Unpaid Leave"];
  const rankOrder = ["Vice President", "Senior Associate", "Manager 4", "Manager 3", "Manager 2", "Manager 1", "Expert 4", "Expert 3", "Expert 2", "Expert 1", "Intermediate", "Band 3", "Band 2", "Band 1"];

  // --- Legacy fetchers (Now wrappers or no-ops if replaced) ---

  const fetchInitialData = async () => {
    // console.log("fetchInitialData called - delegated to React Query");
    // We can trigger refetches here if needed, but RQ handles validity.
    // Assuming subsidiaries is still manual for now as I didn't create a hook for it yet (can add later)
    fetchSubsidiaries();
  };

  const fetchSubsidiaries = async () => {
    try {
      const data = await api("subsidiaries", headerReq, null);
      setSubsidiaries(data);
    } catch (e) {
      console.error(e);
    }
  }

  const fetchStaffs = async () => {
    // React Query handles this, but for compatibility we return the data
    return staffs;
  };

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

  // Legacy: ApprovalList should use useApprovals hook directly. keeping this for safety if other components use it.
  const fetchApproversList = async (page = 1, filter = null, perPage = 25) => {
    setIsLoading(true);
    const headerParams = { ...headerReq, page, per_page: perPage };
    try {
      const result = await api("approvers_list", headerParams, filter);
      setTimeCharges(result);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch calendar data - Keeping as is for now, complex
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
      setTimeCharges(timeChargesData); // careful, this shares state with approvals in legacy code?
      return timeChargesData;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  const fetchMeetings = async (startDate, endDate, year) => {
    // ... existing ...
    setIsLoading(true);
    const headerParams = { ...headerReq, year, start_date: startDate, end_date: endDate, user_id: auth_user_data.id };
    try {
      return await api("meeting_list", headerParams, null);
    } finally { setIsLoading(false); }
  };

  const fetchHolidays = async (startDate, endDate, year) => {
    // ...
    setIsLoading(true);
    const headerParams = { ...headerReq, year, start_date: startDate, end_date: endDate, user_id: auth_user_data.id };
    try {
      const data = await api("holiday_calendar", headerParams, null);
      setHolidaysCalendar(data);
      return data;
    } finally { setIsLoading(false); }
  };

  const fetchLeaves = async (startDate, endDate, year) => {
    // ...
    setIsLoading(true);
    const headerParams = { ...headerReq, year, start_date: startDate, end_date: endDate, user_id: auth_user_data.id };
    try {
      const data = await api("leave_list", headerParams, null);
      setLeaves(data);
      return data;
    } finally { setIsLoading(false); }
  };

  const fetchOtherExpenses = async () => {
    setIsLoading(true);
    try {
      return await api("other_expenses", headerReq, null);
    } finally { setIsLoading(false); }
  };

  // Values to be provided to consumers
  const value = {
    // Auth data
    auth_user: auth_user_data,
    token,

    projects,
    projectsOwnedByUser,
    projectStages,
    projectsInternal,
    setProjectsInternal: (data) => {
      // Warning: setProjectsInternal from React Query is not directly settable like useState
      // If components use this to Optimistically update, we might need a different approach.
      // For now, assuming purely read-only or refetch. 
      // If write needed, use mutation. 
      // Legacy support: invalidating query?
      refetchProjectsInternal();
    },
    departmentalTasks,
    setDepartmentalTasks: (data) => { refetchDeptTasks(); },

    staffs,
    setStaffs: () => { }, // No-op, managed by Query
    fetchStaffs,

    subsidiaries,
    departments,
    setDepartments: () => { }, // No-op

    timeCharges,
    holidaysCalendar,
    leaves,
    headerReq,
    isLoading,
    activities,
    leaveTypes,
    rankOrder,

    fetchInitialData,
    fetchApproversList,
    fetchCalendarData,
    fetchProjectsOwnedByUser,
    fetchTimeCharges,
    fetchMeetings,
    fetchHolidays,
    fetchLeaves,
    fetchDepartmentalTasks: async () => { refetchDeptTasks(); return departmentalTasks; },
    fetchOtherExpenses,

    // setters that might be used
    setProjects: () => { },
    setProjectStages: () => { },
    setTimeCharges,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

export default AppDataContext;