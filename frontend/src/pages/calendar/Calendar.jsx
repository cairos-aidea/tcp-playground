import React, { useState, useEffect, useMemo, useRef } from 'react';
import moment from 'moment';
import "moment-timezone";
import { Calendar as BaseCalendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { api } from '../../api/api';
import { useAppData } from '../../context/AppDataContext';
import EventCustomizer from './components/EventCustomizer';
import { CustomMonthHeader, CustomWeekHeader } from './components/CustomHeader';
import CustomDateHeader from './components/CustomDateHeader';
import CalendarModal from './components/CalendarModal';
import { errorNotification, successNotification, pendingNotification } from '../../components/notifications/notifications';
import CustomToolbar from './components/CustomToolbar';
import { SendHorizonal, SendHorizontal, X, CheckCircle } from 'lucide-react';
import ReactLoading from 'react-loading';
import Search from '../../components/navigations/Search';

const TIMEZONE = "Asia/Singapore";
const localizer = momentLocalizer(moment);
const current_year = moment().year();
const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');

const DragAndDropCalendar = withDragAndDrop(BaseCalendar);

const Calendar = () => {
  const {
    auth_user,
    departments,
    projects,
    projectStages,
    projectsInternal,
    departmentalTasks,
    headerReq,
    fetchTimeCharges,
    fetchHolidays,
    fetchLeaves,
  } = useAppData();

  // START STATE VARIABLES
  const [timeFields, setTimeFields] = useState({
    id: "",
    start_time: "",
    end_time: "",
    is_ot: null,
    next_day_ot: null,
    ot_type: "",
    remarks: ""
  });

  const [formExternal, setFormExternal] = useState({
    project_id: null,
    project_code: "",
    project_label: "",
    stage_id: null,
    stage_label: "",
    activity: "",
    status: ""
  });

  const [formInternal, setFormInternal] = useState({
    project_id: null,
    project_label: "",
    status: ""
  });

  const [formDepartmental, setFormDepartmental] = useState({
    departmental_task_id: null,
    activity: "",
    status: ""
  });

  const [formLeave, setFormLeave] = useState({
    id: "",
    leave_code: "",
    start_time: "",
    end_time: "",
    status: ""
  });

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentView, setCurrentView] = useState("week");
  const [modalType, setModalType] = useState("timeCharge");
  const [modalStatus, setModalStatus] = useState("create");
  const [timeChargeOption, setTimeChargeOption] = useState("external");

  const [showSplitPrompt, setShowSplitPrompt] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [pendingMode, setPendingMode] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [inputErrors, setInputErrors] = useState({});
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [timeEntryStats, setTimeEntryStats] = useState({});
  const [showSidebarOptions, setShowSidebarOptions] = useState('filter');

  // Helper: validate event move/resize
  const validateEventChange = (eventId, newStart, newEnd) => {
    let errors = {};
    // Overlap check
    const excludeId = eventId;
    const overlap = (events || []).some(ev => {
      if (ev.id === excludeId || ev.originalId === excludeId) return false;
      if (ev.status && ev.status.toLowerCase() === "declined") return false;
      const evStart = moment(ev.start);
      const evEnd = moment(ev.end);
      return evStart.isBefore(newEnd) && evEnd.isAfter(newStart);
    });
    if (overlap) {
      errors.time = "Event overlaps with another time charge.";
    }
    // Start/end required
    if (!newStart || !newEnd) {
      errors.time = "Start and End time are required.";
    } else if (moment(newEnd).isSameOrBefore(moment(newStart))) {
      errors.time = "End time must be after start time.";
    }
    // Working hours: 7:00 AM - 7:00 PM
    // const workStart = moment(newStart).set({ hour: 7, minute: 0, second: 0 });
    // const workEnd = moment(newStart).set({ hour: 19, minute: 0, second: 0 });
    // if (moment(newStart).isBefore(workStart) || moment(newEnd).isAfter(workEnd)) {
    //   warnings.push("Some leave duration falls outside regular working hours.");
    // }
    return errors;
  };

  // Handler for event drag
  const handleEventDrop = async ({ event, start, end }) => {
    // Only allow edit for editable events
    if (event.status && ["approved", "declined"].includes((event.status || "").toLowerCase())) return;
    // Validate
    const errors = validateEventChange(event.id, start, end);
    if (Object.keys(errors).length > 0) {
      errorNotification({
        title: "Validation Error",
        message: Object.values(errors).join(" "),
      });
      return;
    }
    // Prepare payload for edit
    let payload = { ...event };
    payload.start_time = moment(start).format("YYYY-MM-DD HH:mm:ss");
    payload.end_time = moment(end).format("YYYY-MM-DD HH:mm:ss");
    // Use chargeType to determine type
    if (event.chargeType === "external") {
      payload = { ...timeFields, ...formExternal, ...payload, time_charge_type: 1 };
    } else if (event.chargeType === "internal") {
      payload = { ...timeFields, ...formInternal, ...payload, time_charge_type: 2 };
    } else if (event.chargeType === "departmental") {
      payload = { ...timeFields, ...formDepartmental, ...payload, time_charge_type: 3 };
    }
    pendingNotification({
      title: "Time Charge Updating",
      message: "Your time charge is being updated.",
    });
    await handleSave(payload, "edit");
  };

  // Handler for event resize
  const handleEventResize = async ({ event, start, end }) => {
    // Only allow edit for editable events
    if (event.status && ["approved", "declined"].includes((event.status || "").toLowerCase())) return;
    // Validate
    const errors = validateEventChange(event.id, start, end);
    if (Object.keys(errors).length > 0) {
      errorNotification({
        title: "Validation Error",
        message: Object.values(errors).join(" "),
      });
      return;
    }
    // Prepare payload for edit
    let payload = { ...event };
    payload.start_time = moment(start).format("YYYY-MM-DD HH:mm:ss");
    payload.end_time = moment(end).format("YYYY-MM-DD HH:mm:ss");
    if (event.chargeType === "external") {
      payload = { ...timeFields, ...formExternal, ...payload, time_charge_type: 1 };
    } else if (event.chargeType === "internal") {
      payload = { ...timeFields, ...formInternal, ...payload, time_charge_type: 2 };
    } else if (event.chargeType === "departmental") {
      payload = { ...timeFields, ...formDepartmental, ...payload, time_charge_type: 3 };
    }
    pendingNotification({
      title: "Time Charge Updating",
      message: "Your time charge is being updated.",
    });
    await handleSave(payload, "edit");
  };

  const yearEventsCache = useRef({});
  const [currentCalendarYear, setCurrentCalendarYear] = useState(current_year);
  // END STATE VARIABLES

  const fetchTimeChargeEvents = async (year, month) => {
    try {
      const result = await fetchTimeCharges(year, month);

      if (result && Array.isArray(result)) {
        result.forEach(tc => {
          if (!tc.start_time && !tc.end_time && tc.time_charge_date) {
            tc.start_time = `${tc.time_charge_date}`;
            tc.end_time = `${tc.time_charge_date}`;
          }
        });
      }

      if (!result || !Array.isArray(result)) {
        return [];
      }

      return result.flatMap(tc => splitNextDayOtEvents(tc));
    } catch (error) {
      return [];
    }
  };

  // Accept holidays and year as arguments for correct context
  const splitNextDayOtEvents = (tc, holidaysArg, yearArg) => {
    const start = moment.tz(tc.start_time, TIMEZONE);
    const end = moment.tz(tc.end_time, TIMEZONE);
    const baseEvent = {
      id: tc.id,
      title: tc.project_label || tc.activity || "Time Charge",
      start: start.toDate(),
      end: end.toDate(),
      is_ot: !!tc.is_ot,
      next_day_ot: !!tc.next_day_ot,
      chargeType:
        tc.time_charge_type === 1
          ? "external"
          : tc.time_charge_type === 2
            ? "internal"
            : tc.time_charge_type === 3
              ? "departmental"
              : "",
      project_id: tc.project_id,
      project_code: tc.project_code,
      project_label: tc.project_label,
      stage_id: tc.stage_id,
      stage_label: tc.stage_label,
      departmental_task_id: tc.departmental_task_id,
      activity: tc.activity,
      remarks: tc.remarks || "",
      status: tc.status || "",
      type: "timeCharge",
      originalId: tc.id,
      originalStart: tc.start_time,
      originalEnd: tc.end_time,
      ot_type: getOtType(start, holidaysArg || holidays, yearArg || current_year),
      source: tc.source || "",
      duration_hrs: tc.duration_hrs || null,
      duration_min: tc.duration_min || null,
      approver_id: tc.approver_id || null,
      updated_at: tc.updated_at || null,
    };

    // if (tc.next_day_ot === 1) {
    if (moment(tc.start_time).format("YYYY-MM-DD") !== moment(tc.end_time).format("YYYY-MM-DD")) {
      const endOfDay = start.clone().endOf("day");
      const startOfNextDay = endOfDay.clone().add(1, "second");

      return [
        {
          ...baseEvent,
          id: `${tc.id}-part1`,
          title: `${baseEvent.title} (Part 1)`,
          start: start.toDate(),
          end: endOfDay.toDate()
        },
        {
          ...baseEvent,
          id: `${tc.id}-part2`,
          title: `${baseEvent.title} (Part 2)`,
          start: startOfNextDay.toDate(),
          end: end.toDate()
        }
      ];
    }

    return [baseEvent];
  };

  const fetchLeaveEvents = async (startOfMonth, endOfMonth, year) => {
    const result = await fetchLeaves(startOfMonth, endOfMonth, year);
    return (result || []).map(lv => ({
      id: lv.id,
      title: lv.description || "Leave",
      start: moment.tz(lv.start_time, TIMEZONE).toDate(),
      end: moment.tz(lv.end_time, TIMEZONE).toDate(),
      leave_code: lv.leave_type,
      type: "leave",
      duration_hrs: Number(lv.duration_hrs),
      duration_min: Number(lv.duration_mns),
      status: lv.status,
    }));
  };

  const fetchHolidayEvents = async (startOfMonth, endOfMonth, year) => {
    const result = await fetchHolidays(startOfMonth, endOfMonth, year);

    // Handling Fixed Holidays
    const fixed = (result?.fixedHolidays || []).map(h => ({
      id: `fixed-${h.id}`,
      title: h.holiday_title || "Holiday",
      start: moment(year + "-" + h.date, "YYYY-MM-DD").toDate(),
      end: moment(year + "-" + h.date, "YYYY-MM-DD").toDate(),
      type: "holiday",
      holiday_type: h.holiday_type,
      description: h.description,
    }));

    // Handling Dynamic Holidays
    const dynamic = (result?.dynamicHolidays || []).map(h => ({
      id: `dynamic-${h.id}`,
      title: h.holiday_title || "Holiday",
      start: moment(h.date, "YYYY-MM-DD").toDate(),
      end: moment(h.date, "YYYY-MM-DD").toDate(),
      type: "holiday",
      holiday_type: h.holiday_type,
      description: h.description,
    }));

    return [...fixed, ...dynamic];
  };

  // Fetch events for a specific year and month
  const fetchEventsForYearMonth = async (year, month) => {
    setIsEventsLoading(true);
    const cacheKey = `${year}-${month}`;
    if (yearEventsCache.current[cacheKey]) {
      setIsEventsLoading(false);
      return yearEventsCache.current[cacheKey];
    }
    
    try {
      const timeCharges = await fetchTimeChargeEvents(year, month);
      const leaves = await fetchLeaveEvents(startOfMonth, endOfMonth, year);
      const holidays = await fetchHolidayEvents(startOfMonth, endOfMonth, year);

      const allEvents = [...timeCharges, ...leaves, ...holidays];
      yearEventsCache.current[cacheKey] = allEvents;
      return allEvents;
    } catch (error) {
      return [];
    } finally {
      setIsEventsLoading(false);
    }
  };

  const handleYearChange = async (date) => {
    const year = moment(date).year();
    const month = moment(date).month() + 1; // month is 0-indexed

    if (year !== currentCalendarYear) {
      const eventsForYearMonth = await fetchEventsForYearMonth(year, month);
      setEvents(prevEvents => [
        ...prevEvents.filter(e => e.type !== "timeCharge" && e.type !== "leave" && e.type !== "holiday"),
        ...eventsForYearMonth
      ]);
      setCurrentCalendarYear(year);  // Update the current calendar year
    }
  };

  useEffect(() => {
    document.title = "Calendar | Aidea Time Charging";

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    const loadInitialEvents = async () => {
      setIsEventsLoading(true);
      try {
        const currentYear = moment().year();
        const currentMonth = moment().month() + 1; // month is 0-indexed
        const eventsForYearMonth = await fetchEventsForYearMonth(currentYear, currentMonth);
        setEvents(eventsForYearMonth);  // Set events for current year and month
        setCurrentCalendarYear(currentYear);
      } catch (err) {
        console.error("Error loading initial calendar events:", err);
      } finally {
        setIsEventsLoading(false);  
      }
    };

    loadInitialEvents();

    // Attach resize event listener
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // START DROPDOWN OPTIONS
  const externalProjectOptions = useMemo(() => {
    return (projects || [])
      .map(p => ({
        value: p.id,
        label: `${p.project_code} - ${p.project_name}`,
        project_code: p.project_code,
        project_label: `${p.project_name}`,
        studio: p.studio_id
          ? p.studio_id
          : (p.studio
            ? p.studio
            : (p.number ? p.number : "")),
      }))
      .sort((a, b) => a.project_label.localeCompare(b.project_label));
  }, [projects]);

  const externalProjectStages = useMemo(() => {
    if (!formExternal.project_id || !timeFields.start_time) return [];
    const selectedProject = (projects || []).find(p => String(p.id) === String(formExternal.project_id));
    const selectedCode = selectedProject ? selectedProject.project_code : "";
    const entryDate = moment(timeFields.start_time, "YYYY-MM-DD HH:mm:ss");
    const isProbonoOrMarketing = selectedProject && (selectedProject.allow_no_dates === 1);
    return (projectStages || [])
      .filter(stage => {
        if (stage.project_code !== selectedCode) return false;
        // If stage_name is "Marketing" but is_marketing == 0, don't show this stage
        // if (stage.stage_name === "Marketing" && stage.is_marketing === null) return false;
        // If project is probono or marketing, include all stages for this project
        if (isProbonoOrMarketing) return true;
        // Otherwise, filter by entryDate
        return (
          moment(stage.start_date, "YYYY-MM-DD").isBefore(entryDate, 'day') &&
          moment(stage.end_date, "YYYY-MM-DD").isAfter(entryDate, 'day')
        );
      })
      .map(stage => ({
        value: stage.id,
        label: `${stage.stage_name}`,
        stage_label: `${stage.stage_name}`,
      }));
  }, [formExternal.project_id, timeFields.start_time, projectStages, projects]);

  const internalProjectOptions = useMemo(() => {
    if (!projectsInternal || !Array.isArray(projectsInternal.projects) || !Array.isArray(projectsInternal.subsidiaries)) {
      return [];
    }

    const subsidiaryIds = projectsInternal.subsidiaries.map(sub => sub.id);

    return projectsInternal.projects
      .filter(proj => subsidiaryIds.includes(proj.subsidiary_id))
      .map(proj => ({
        value: proj.id,
        label: `${proj.project_code} - ${proj.project_name}`,
        project_label: `${proj.project_name}`
      }));
  }, [projectsInternal]);

  const departmentalTaskOptions = useMemo(() => {
    if (!departmentalTasks || !Array.isArray(departmentalTasks.tasks) || !Array.isArray(departmentalTasks.departments)) {
      return [];
    }
    // Get all department IDs
    const departmentIds = departmentalTasks.departments.map(dep => dep.id);
    // Filter tasks that belong to the listed departments
    return departmentalTasks.tasks
      .filter(task => departmentIds.includes(task.department_id))
      .map(t => ({
        value: t.id,
        label: t.task_name,
        task_name: t.task_name,
      }));
  }, [departmentalTasks]);
  // END DROPDOWN OPTIONS

  const closeModal = () => {
    setShowModal(false);
    setModalType("timeCharge");
    setTimeChargeOption("external");
    setFormExternal({ project_id: null, project_code: "", project_label: "", stage_id: null, stage_label: "", activity: "", status: "" });
    setFormInternal({ project_id: null, project_label: "", status: "" });
    setFormDepartmental({ departmental_task_id: null, activity: "", status: "" });
    setFormLeave({ leave_code: "", start_time: "", end_time: "", status: "" });
    setTimeFields({
      id: "",
      start_time: "",
      end_time: "",
      is_ot: null,
      next_day_ot: null,
      ot_type: "",
      remarks: ""
    });
  };

  const getOtType = (dateMoment, holidays, currentYear) => {
    const selectedDate = dateMoment.format("YYYY-MM-DD");
    const isWeekend = dateMoment.day() === 0 || dateMoment.day() === 6;
    const isHoliday = holidays.some(h => {
      return (
        (h.id && (
          (h.id === `fixed-${currentYear}-${selectedDate}`) ||
          (h.id === `dynamic-${currentYear}-${selectedDate}`) ||
          (h.id === `fixed-${selectedDate}`) ||
          (h.id === `dynamic-${selectedDate}`)
        )) ||
        (h.start && moment(h.start).format("YYYY-MM-DD") === selectedDate)
      );
    });

    if (isHoliday && isWeekend) return "weekend_holiday";
    if (isHoliday) return "weekday_holiday";
    if (isWeekend) return "weekend";

    return "";
  };

  const handleSelectSlot = ({ start, end }) => {
    setModalStatus("create");
    const now = moment().tz(TIMEZONE);
    let startMoment = moment(start).tz(TIMEZONE);
    let endMoment = moment(end).tz(TIMEZONE);

    if (currentView === "month") {
      startMoment = moment(start).set({
        hour: now.hour(),
        minute: now.minute(),
        second: 0,
        millisecond: 0
      });
      endMoment = startMoment.clone().add(1, "hour");
    }

    const start_time = startMoment.format("YYYY-MM-DD HH:mm:ss");
    const end_time = endMoment.format("YYYY-MM-DD HH:mm:ss");
    const ot_type = getOtType(startMoment, holidays, current_year);
    // console.log("Selected slot:", start_time, end_time, "OT Type:", ot_type);
    setShowModal(true);
    setTimeFields(tf => ({
      ...tf,
      start_time,
      end_time,
      is_ot: !!ot_type,
      next_day_ot: false,
      ot_type,
      remarks: ""
    }));
  };

  const handleSelectEvent = (event) => {
    if (event.type === "leave" || event.type === "holiday" || event.source === "SYNC-SP-LIST") {
      return;
    }

    // Handle split next day OT events (part1/part2)
    let baseEvent = event;
    let isSplitPart = false;
    if (event.id && typeof event.id === "string" && event.id.endsWith("-part1")) {
      // part1: get the original event
      baseEvent = events.find(ev => ev.id === event.originalId) || event;
      isSplitPart = true;
    } else if (event.id && typeof event.id === "string" && event.id.endsWith("-part2")) {
      baseEvent = events.find(ev => ev.id === event.originalId) || event;
      isSplitPart = true;
    }

    // If split part, use originalId and originalStart/End for state
    const eventStart = moment(isSplitPart ? event.start : baseEvent.start).tz(TIMEZONE);
    const ot_type = getOtType(eventStart, holidays, current_year);
    const chargeType = baseEvent.chargeType || "external";

    setModalType(baseEvent.type || "timeCharge");
    setTimeChargeOption(chargeType);
    setModalStatus((baseEvent.status && (baseEvent.status.toLowerCase() === "approved" || baseEvent.status.toLowerCase() === "declined")) ? "view" : "edit");

    // Always use the latest remarks from the event, fallback to previous timeFields if missing
    let remarksValue = (typeof baseEvent.remarks !== 'undefined') ? baseEvent.remarks : (timeFields.remarks || "");

    // if ((baseEvent.next_day_ot && baseEvent.originalId) || isSplitPart) {
    if ((moment(baseEvent.start).format("YYYY-MM-DD") !== moment(baseEvent.end).format("YYYY-MM-DD") && baseEvent.originalId) || isSplitPart) {
      // For split events, get both part1 and part2
      const part1 = events.find(ev => ev.id === `${baseEvent.originalId}-part1`);
      const part2 = events.find(ev => ev.id === `${baseEvent.originalId}-part2`);
      const start = part1 ? moment(part1.start).tz(TIMEZONE) : moment(baseEvent.start).tz(TIMEZONE);
      const end = part2 ? moment(part2.end).tz(TIMEZONE) : moment(baseEvent.end).tz(TIMEZONE);
      setTimeFields({
        id: baseEvent.originalId,
        start_time: start.format("YYYY-MM-DD HH:mm:ss"),
        end_time: end.format("YYYY-MM-DD HH:mm:ss"),
        is_ot: baseEvent.is_ot || false,
        next_day_ot: baseEvent.next_day_ot || false,
        ot_type: ot_type || baseEvent.ot_type || "",
        option: chargeType,
        remarks: remarksValue
      });
    } else {
      setTimeFields({
        id: baseEvent.id,
        start_time: moment(baseEvent.start).format("YYYY-MM-DD HH:mm:ss"),
        end_time: moment(baseEvent.end).format("YYYY-MM-DD HH:mm:ss"),
        is_ot: baseEvent.is_ot || false,
        next_day_ot: baseEvent.next_day_ot || false,
        ot_type: ot_type || baseEvent.ot_type || "",
        option: chargeType,
        remarks: remarksValue
      });
    }

    if (baseEvent.type === "leave") {
      setFormLeave({
        id: baseEvent.id || "",
        leave_code: baseEvent.leave_code || "",
        start_time: moment(baseEvent.start).format("YYYY-MM-DD HH:mm:ss"),
        end_time: moment(baseEvent.end).format("YYYY-MM-DD HH:mm:ss"),
        status: baseEvent.status || ""
      });
    } else {
      if (chargeType === "external") {
        setFormExternal({
          project_id: baseEvent.project_id || null,
          project_code: baseEvent.project_code || "",
          project_label: baseEvent.project_label || "",
          stage_id: baseEvent.stage_id || null,
          stage_label: baseEvent.stage_label || "",
          activity: baseEvent.activity || "",
          status: baseEvent.status || ""
        });
      } else if (chargeType === "internal") {
        setFormInternal({
          project_id: baseEvent.project_id || null,
          project_label: baseEvent.project_label || "",
          status: baseEvent.status || ""
        });
      } else if (chargeType === "departmental") {
        setFormDepartmental({
          departmental_task_id: baseEvent.departmental_task_id || null,
          activity: baseEvent.activity || "",
          status: baseEvent.status || ""
        });
      }
    }

    setShowModal(true);
  };

  // Helper: get duration in minutes
  const getDurationMinutes = (start, end, ot = false) => {
    const s = moment(start);
    const e = moment(end);

    // Just calculate the difference in minutes, no rules, no max, no filtering
    let duration = e.diff(s, 'minutes');
    if (duration < 0) duration = 0;

    // If start is before 7:00 AM, adjust to 7:00 AM
    // const workStart = s.clone().set({ hour: 7, minute: 0, second: 0, millisecond: 0 });
    // const actualStart = s.isBefore(workStart) ? workStart : s;

    // Deduct lunch break if event covers any part of 12:00-13:00
    // const lunchStart = actualStart.clone().set({ hour: 11, minute: 30, second: 0, millisecond: 0 });
    // const lunchEnd = actualStart.clone().set({ hour: 12, minute: 30, second: 0, millisecond: 0 });
    // if (actualStart.isBefore(lunchEnd) && e.isAfter(lunchStart)) {
    //   // Overlaps lunch, deduct the overlap (max 60 min)
    //   const overlap = Math.min(
    //     e.diff(lunchStart, 'minutes'),
    //     lunchEnd.diff(actualStart, 'minutes'),
    //     60
    //   );
    //   duration -= Math.max(0, overlap);
    // }

    // if (
    //   ot ||
    //   s.day() === 0 || s.day() === 6 || // weekend
    //   holidays.some(h => moment(h.start).isSame(s, 'day')) // holiday
    // ) {
    //   // If overtime, weekend, or holiday, do not deduct lunch break
    //   duration = e.diff(s, 'minutes');
    //   if (duration < 0) duration = 0;
    // }

    return duration;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log("Submitting form with modalType:", modalType, "and timeChargeOption:", timeChargeOption);

    // Prevent submit if there are validation errors
    if (Object.keys(inputErrors).length > 0) {
      return;
    }

    let payload = {};
    if (modalType === "timeCharge") {
      if (timeChargeOption === "external") {
        payload = { ...timeFields, ...formExternal, time_charge_type: 1 };
      } else if (timeChargeOption === "internal") {
        payload = { ...timeFields, ...formInternal, time_charge_type: 2 };
      } else if (timeChargeOption === "departmental") {
        payload = { ...timeFields, ...formDepartmental, time_charge_type: 3 };
      }
    } else if (modalType === "leave") {
      payload = { ...formLeave };
    }

    const shouldSplit =
      modalType === "timeCharge" &&
      timeFields.start_time &&
      timeFields.end_time &&
      getDurationMinutes(moment(timeFields.start_time), moment(timeFields.end_time)) >= 540 &&
      moment(timeFields.start_time, "YYYY-MM-DD HH:mm:ss").hour() <= 10 &&
      !getOtType(moment(timeFields.start_time, "YYYY-MM-DD HH:mm:ss"), holidays, current_year) &&
      (!payload.to_split || payload.to_split === "yes");

    const mode = modalStatus === "edit" ? "edit" : "create";

    // if (shouldSplit) {
    //   setPendingPayload(payload);
    //   setPendingMode(mode);
    //   setShowSplitPrompt(true);
    //   return;
    // }

    // Check for changes if editing
    if (mode === "edit") {
      let hasChanges = false;
      if (modalType === "timeCharge") {
        const originalEvent = events.find(ev =>
          String(ev.id) === String(timeFields.id) || String(ev.originalId) === String(timeFields.id)
        );
        if (originalEvent) {
          const compareFields = [
            "start_time", "end_time", "is_ot", "next_day_ot", "ot_type",
            "project_id", "project_code", "project_label", "stage_id", "stage_label",
            "activity", "remarks", "departmental_task_id", "status"
          ];
          for (const field of compareFields) {
            if ((payload[field] || "") !== (originalEvent[field] || "")) {
              hasChanges = true;
              break;
            }
          }
        } else {
          hasChanges = true;
        }
      } else if (modalType === "leave") {
        const originalEvent = events.find(ev => String(ev.id) === String(formLeave.id));
        if (originalEvent) {
          const compareFields = ["leave_code", "start_time", "end_time", "status"];
          for (const field of compareFields) {
            if ((payload[field] || "") !== (originalEvent[field] || "")) {
              hasChanges = true;
              break;
            }
          }
        } else {
          hasChanges = true;
        }
      }
      if (!hasChanges) {
        closeModal();
        return;
      }
    }

    await handleSave(payload, mode);
  };

  const handleSplitChoice = async (choice) => {
    setShowSplitPrompt(false);

    if (choice === "cancel") {
      return;
    }

    const updatedPayload = {
      ...pendingPayload,
      to_split: choice === "yes",
    };

    await handleSave(updatedPayload, pendingMode);
  };

  const handleSave = async (payload, mode) => {
    setLoading(true);
    try {
      let apiResult;
      if (modalType === "timeCharge") {
        if (mode === "edit") {
          apiResult = await api("time_charge_update", { ...headerReq, id: timeFields.id ? timeFields.id : payload.id }, payload);
          if (apiResult?.regular || apiResult?.id) {
            // Use the year/month of the edited time_charge, not always today
            const eventStart = payload.start_time || timeFields.start_time;
            const year = eventStart ? moment(eventStart).year() : moment().year();
            const month = eventStart ? moment(eventStart).month() + 1 : moment().month() + 1;
            const cacheKey = `${year}-${month}`;
            if (yearEventsCache.current[cacheKey]) {
              delete yearEventsCache.current[cacheKey];
            }
            const allEvents = await fetchEventsForYearMonth(year, month);
            setEvents(allEvents);
            successNotification({ title: "Success", message: "Time charge updated successfully." })
          } else {
            return;
          }
        } else {
          apiResult = await api("time_charge_create", headerReq, payload);
          if (apiResult?.regular || apiResult?.id) {
            // Use the year/month of the created time_charge, not always today
            const eventStart = payload.start_time;
            const year = eventStart ? moment(eventStart).year() : moment().year();
            const month = eventStart ? moment(eventStart).month() + 1 : moment().month() + 1;
            const cacheKey = `${year}-${month}`;
            if (yearEventsCache.current[cacheKey]) {
              delete yearEventsCache.current[cacheKey];
            }
            const allEvents = await fetchEventsForYearMonth(year, month);
            setEvents(allEvents);
          } else {
            return;
          }
        }
      } else if (modalType === "leave") {
        if (mode === "edit") {
          // await api.put(`/leaves/${formLeave.id}`, payload, headerReq());
        } else {
          // await api.post("/leaves", payload, headerReq());
        }
      }

      closeModal();
    } catch (err) {
      // console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [dayTotals, setDayTotals] = useState({});

  // Compute daily totals for regular and OT hours
  useEffect(() => {
    const totals = {};

    (events || []).forEach(ev => {
      if (ev.type !== "timeCharge") return;
      if (ev.status && ev.status.toLowerCase() === "declined") return;

      const start = moment(ev.start);
      const end = moment(ev.end);
      const key = start.format("YYYY-MM-DD");

      if (!totals[key]) {
        totals[key] = { regular: 0, ot: 0 };
      }

      // If event is marked as OT (is_ot true), count all duration as OT
      if (ev.is_ot) {
        const otDuration = getDurationMinutes(start, end) / 60;
        totals[key].ot += otDuration;
        return;
      }

      // // Define working hours: 7am–7pm
      // const workStart = start.clone().set({ hour: 7, minute: 0, second: 0 });
      // const workEnd = start.clone().set({ hour: 19, minute: 0, second: 0 });

      // // Clamp start and end times to within working window
      // const clampedStart = moment.max(start, workStart);
      // const clampedEnd = moment.min(end, workEnd);

      let regular = 0;
      // if (clampedEnd.isAfter(clampedStart)) {
      //   regular = getDurationMinutes(clampedStart, clampedEnd) / 60;
      // }

      regular = getDurationMinutes(start, end) / 60;
      // Add to totals
      totals[key].regular += regular;
    });

    // Cap regular at 8 hours per day, move excess to OT
    setDayTotals(totals);
  }, [events]);

  const getDayTotals = (date) => {
    const key = moment(date).format("YYYY-MM-DD");
    return dayTotals[key] || { regular: 0, ot: 0 };
  };

  const CustomDateHeaderWrapper = (props) => (
    <CustomDateHeader {...props} getDayTotals={getDayTotals} isMobile={windowWidth < 640} />
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="container-fluid h-full">
        <div className="w-full sticky top-0 z-10 bg-white border-b">
          <div className="flex h-14 items-center justify-between px-6">
            <h1 className="text-xl font-semibold text-gray-700">Time Charging</h1>

            <div className="flex gap-3">
            {/* <Search
              placeholder="Search task"
            /> */}
          </div>
          </div>
        </div>

        <div className="grid grid-cols-12 h-[calc(100vh-4rem)] overflow-hidden sm:overflow-y-auto">
          <div className="col-span-12 overflow-x-auto h-full flex flex-col pb-20 sm:pb-4 relative">
            {isEventsLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/100 z-50">
                <ReactLoading type="bars" color="#333" height={60} width={60} />
              </div>
            )}

            <BaseCalendar
              localizer={localizer}
              events={events}
              selectable={true}
              resizable={true}
              defaultView={"week"}
              views={["month", "week", "day"]}
              step={15}
              timeslots={4}
              style={{ height: "100%" }}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={(e) => handleSelectEvent(e)}
              view={currentView}
              onView={setCurrentView}
              onNavigate={(date) => { handleYearChange(date); }}
              onEventDrop={['day', 'week'].includes(currentView) ? handleEventDrop : undefined}
              onEventResize={['day', 'week'].includes(currentView) ? handleEventResize : undefined}
              draggableAccessor={['day', 'week'].includes(currentView) ? (event => !event.status || !["approved", "declined"].includes((event.status || "").toLowerCase())) : undefined}
              resizableAccessor={['day', 'week'].includes(currentView) ? (event => !event.status || !["approved", "declined"].includes((event.status || "").toLowerCase())) : undefined}
              components={{
                event: (props) => <EventCustomizer {...props} view={currentView} event={props.event} />,
                month: {
                  dateHeader: CustomDateHeaderWrapper,
                  header: (props) => <CustomMonthHeader {...props} />
                },
                week: {
                  header: (props) => <CustomWeekHeader {...props} event={props.event} />
                },
                toolbar: (props) => <CustomToolbar {...props} userHireDate={auth_user.hire_date} events={events} showSidebarOptions={showSidebarOptions} setShowSidebarOptions={setShowSidebarOptions} isMobile={windowWidth < 640} />,
              }}
              slotPropGetter={(date) => {
                const day = date.getDay(); // 0 = Sunday, 6 = Saturday
                const hour = date.getHours();
                const minute = date.getMinutes();

                // --- Holiday check ---
                // Format date as MM-DD for fixed holidays
                const mmdd = date.toISOString().slice(5, 10); // "MM-DD"
                // Format date as YYYY-MM-DD for dynamic holidays
                const yyyymmdd = date.toISOString().slice(0, 10); // "YYYY-MM-DD"

                // const isHoliday =
                //   holidays.fixedHolidays.some(h => h.date === mmdd) ||
                //   holidays.dynamicHolidays.some(h => h.date === yyyymmdd);

                // Only apply highlight if it's a weekday and not a holiday
                if (day >= 1 && day <= 5) {
                  // Working hours (7 AM – 7 PM)
                  if (hour >= 7 && hour < 19) {
                    // Lunch slot (11:30–12:30)
                    // if ((hour === 11 && minute === 30)) {
                    //   // Top border broken line at 11:30
                    //   return { className: "highlight-slot highlight-slot-lunch highlight-slot-lunch-top" };
                    // }
                    // if ((hour === 12 && minute === 15)) {
                    //   // Bottom border broken line at 12:30
                    //   return { className: "highlight-slot highlight-slot-lunch highlight-slot-lunch-bottom" };
                    // }
                    // if ((hour === 11 && minute > 30) || (hour === 12 && minute < 30)) {
                    //   return { className: "highlight-slot highlight-slot-lunch" };
                    // }
                    return { className: "highlight-slot" };
                  }

                  // Lunch slot outside working hours safeguard
                  // if ((hour === 11 && minute === 30)) {
                  //   return { className: "highlight-slot-lunch highlight-slot-lunch-top" };
                  // }
                  // if ((hour === 12 && minute === 30)) {
                  //   return { className: "highlight-slot-lunch highlight-slot-lunch-bottom" };
                  // }
                  // if ((hour === 11 && minute > 30) || (hour === 12 && minute < 30)) {
                  //   return { className: "highlight-slot-lunch" };
                  // }
                }

                return {};
              }}

            />
          </div>
          {/* {showSidebarOptions && (
            <div className="hidden sm:block col-span-2 sticky border-l transition-all duration-300 overflow-auto h-[calc(100vh-8rem)]">
              {showSidebarOptions === 'filter' && (
                <TimeEntrySummary
                  timeEntries={events.filter(ev => ev.type === "timeCharge")}
                  selectedDate={moment().toDate()}
                  calendarView={currentView}
                />
              )}
            </div>
          )} */}
        </div>

        {showSplitPrompt && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-xl shadow-md w-full max-w-lg relative overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b px-6 py-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Split Time Charge</h2>
                <button
                  className="text-gray-600 hover:text-gray-800"
                  onClick={() => handleSplitChoice("cancel")}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 pb-6 overflow-y-auto flex-1">
                <p className="text-gray-700 text-sm mb-4">
                  Your time charge entry is eligible for an overtime. Select how you would like to save it.
                </p>
                <div className="flex flex-col gap-4">
                  {/* Option 1: Split into Regular and Overtime */}
                  <button
                    onClick={() => setPendingPayload({ ...pendingPayload, splitOption: "split" })}
                    className={`border rounded-lg p-4 text-left transition-all duration-200 shadow-sm focus:outline-none ${pendingPayload?.splitOption === "split"
                      ? "border-primary ring-2 ring-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary"
                      }`}
                    type="button"
                  >
                    {/* Title with icon */}
                    <div className="flex items-center gap-2">
                      <CheckCircle
                        size={20}
                        className={
                          pendingPayload?.splitOption === "split"
                            ? "text-primary"
                            : "text-gray-300"
                        }
                        strokeWidth={2.2}
                        fill={pendingPayload?.splitOption === "split" ? "#facc15" : "none"}
                      />
                      <span className="font-semibold text-gray-900">Split Time: Regular & Overtime</span>
                    </div>

                    {/* Description to make it user-friendly */}
                    <p className="text-xs text-gray-700 mb-2">
                      Automatically split your time charge entry into regular and overtime hours.
                    </p>

                    {/* Time Charges (shown if data is present) */}
                    {(() => {
                      if (!pendingPayload?.start_time || !pendingPayload?.end_time) return null;

                      const start = moment(pendingPayload.start_time);
                      const end = moment(pendingPayload.end_time);
                      const totalMinutes = getDurationMinutes(start, end);
                      const regularHours = Math.min(totalMinutes / 60, 8);
                      const overtimeHours = Math.max((totalMinutes / 60) - 8, 0);
                      const regularEnd = end.clone().subtract(overtimeHours, 'hours');

                      return (
                        <div className="text-xs text-gray-700 space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-orange-500 font-medium">⏱ Time Charge #1 (Regular)</span>
                            <span>
                              {regularHours.toFixed(2)}h — {start.format("hh:mm A")} to {regularEnd.format("hh:mm A")}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-orange-500 font-medium">⏱ Time Charge #2 (Overtime)</span>
                            {overtimeHours > 0 ? (
                              <span>
                                {overtimeHours.toFixed(2)}h — {regularEnd.format("hh:mm A")} to {end.format("hh:mm A")}
                              </span>
                            ) : (
                              <span>0.00h</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </button>

                  {/* Option 2: All Regular */}
                  <button
                    onClick={() => setPendingPayload({ ...pendingPayload, splitOption: "regular" })}
                    className={`border rounded-lg p-4 text-left transition-all duration-200 shadow-sm focus:outline-none ${pendingPayload?.splitOption === "regular"
                      ? "border-primary ring-2 ring-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary"
                      }`}
                    type="button"
                  >
                    {/* Header with icon */}
                    <div className="flex items-center gap-2">
                      <CheckCircle
                        size={20}
                        className={
                          pendingPayload?.splitOption === "regular"
                            ? "text-primary"
                            : "text-gray-300"
                        }
                        strokeWidth={2.2}
                        fill={pendingPayload?.splitOption === "regular" ? "#facc15" : "none"}
                      />
                      <span className="font-semibold text-gray-900">Save All as Regular</span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-700 mb-2">
                      Time charge entry will be saved as regular hours only.
                    </p>

                    {/* Time summary */}
                    {(() => {
                      if (!pendingPayload?.start_time || !pendingPayload?.end_time) return null;

                      const start = moment(pendingPayload.start_time);
                      const end = moment(pendingPayload.end_time);
                      const totalMinutes = getDurationMinutes(start, end);
                      const cappedRegularHours = Math.min(totalMinutes / 60, 8);

                      return (
                        <div className="text-xs text-gray-700 space-y-1">
                          <div className="flex items-start gap-2">
                            <span className="text-orange-500 font-medium">⏱ Time Charge #1 (Regular)</span>
                            <span>
                              {cappedRegularHours.toFixed(2)}h — {start.format("hh:mm A")} to {end.format("hh:mm A")}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={async () => {
                      if (!pendingPayload?.splitOption) return;
                      // Save based on selection
                      if (pendingPayload.splitOption === "split") {
                        await handleSplitChoice("yes");
                      } else if (pendingPayload.splitOption === "regular") {
                        await handleSplitChoice("no");
                      }
                    }}
                    className={`px-6 py-2 text-sm text-white rounded-full transition duration-200 ${pendingPayload?.splitOption ? "bg-primary hover:bg-primary-700" : "bg-gray-300 cursor-not-allowed"
                      }`}
                    disabled={!pendingPayload?.splitOption}
                  >
                    Save
                  </button>
                  {/* <button
            onClick={() => handleSplitChoice("cancel")}
            className="px-6 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition duration-200"
          >
            Cancel
          </button> */}
                </div>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <CalendarModal
            show={showModal}
            onClose={closeModal}
            modalStatus={modalStatus}
            modalType={modalType}
            setModalType={setModalType}
            timeFields={timeFields}
            setTimeFields={setTimeFields}
            timeChargeOption={timeChargeOption}
            setTimeChargeOption={setTimeChargeOption}
            formExternal={formExternal}
            setFormExternal={setFormExternal}
            formInternal={formInternal}
            setFormInternal={setFormInternal}
            formDepartmental={formDepartmental}
            setFormDepartmental={setFormDepartmental}
            formLeave={formLeave}
            setFormLeave={setFormLeave}
            events={events}
            inputErrors={inputErrors}
            setInputErrors={setInputErrors}
            // timeWarnings={timeWarnings}
            externalProjectOptions={externalProjectOptions}
            externalProjectStages={externalProjectStages}
            internalProjectOptions={internalProjectOptions}
            departmentalTaskOptions={departmentalTaskOptions}
            handleSubmit={handleSubmit}
            loading={loading}
            setEvents={setEvents}
            headerReq={headerReq}
            setLoading={setLoading}
            getDurationMinutes={getDurationMinutes}
            getDayTotals={getDayTotals}
            auth_user={auth_user}
            departments={departments}
          />
        )}
      </div>
    </div>
  );
};

export default Calendar;
