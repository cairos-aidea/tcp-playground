import React, { useEffect, useState, useMemo } from "react";
import { components } from "react-select";
import moment from "moment";
import Select from "react-select";
import { api } from "../../../api/api";
import { Bars } from "react-loader-spinner";
import ReactLoading from "react-loading";
import { Calendar as DnDCalendar, Views, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import EventCustomizer from "./EventCustomizer";
import { useAppData } from "../../../context/AppDataContext";
import { Sheet, FileUser, CircleX, CircleAlert, SendHorizontal, X, Menu, CalendarDays, Clock, UserCheck, CheckCircle2, XCircle, Hourglass, ClipboardList, ArrowLeft, ArrowRight, UserRoundPenIcon, Timer, TimerIcon, CalendarClock, CalendarFold, CalendarFoldIcon } from "lucide-react";
import GlobalSelect from "../../../components/layouts/GlobalSelect";

const DragAndDropCalendar = withDragAndDrop(DnDCalendar);

const CalendarModal = ({
  show,
  onClose,
  modalStatus,
  modalType,
  setModalType,
  timeFields,
  setTimeFields,
  timeChargeOption,
  setTimeChargeOption,
  formExternal,
  setFormExternal,
  formInternal,
  setFormInternal,
  formDepartmental,
  setFormDepartmental,
  formLeave,
  setFormLeave,
  events,
  inputErrors,
  setInputErrors,
  externalProjectOptions,
  externalProjectStages,
  internalProjectOptions,
  departmentalTaskOptions,
  handleSubmit,
  loading,
  setEvents,
  headerReq,
  setLoading,
  getDurationMinutes,
  getDayTotals,
  auth_user,
  departments,
}) => {
  const {
    staffs,
    activities
  } = useAppData();

  useEffect(() => {
    if (timeFields.option === undefined && timeChargeOption) {
      setTimeFields(tf => ({ ...tf, option: timeChargeOption }));
    }
  }, [timeFields.option, timeChargeOption]);

  const [timeWarnings, setTimeWarnings] = useState([]);

  const [calendarDate, setCalendarDate] = useState(
    timeFields?.start_time ? new Date(timeFields.start_time) : new Date()
  );

  const studios = useMemo(() => {
    const seen = new Map();
    externalProjectOptions.forEach(p => {
      const studioId = p.studio_id || p.studio;
      const studioName =
        typeof studioId === "number"
          ? departments.find(d => d.id === studioId)?.name || "Others"
          : p.studio_name || p.studio || "Others";
      if (!seen.has(studioId)) {
        seen.set(studioId, { id: studioId, name: studioName });
      }
    });
    return Array.from(seen.values());
  }, [externalProjectOptions, departments]);

  // --- State ---
  const [selectedStudios, setSelectedStudios] = useState(studios.map(s => s.id));
  const isAllSelected = selectedStudios.length === studios.length;

  const toggleStudio = id => {
    setSelectedStudios(prev =>
      prev.includes(id)
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    );
  };

  // --- Filter & group ---
  const filteredProjects = useMemo(() => {
    const filtered = isAllSelected
      ? externalProjectOptions
      : externalProjectOptions.filter(p =>
        selectedStudios.includes(p.studio_id || p.studio)
      );

    const userStudioProjects = filtered.filter(
      p => (p.studio_id || p.studio) === auth_user.department_id
    );

    const otherProjects = filtered.filter(
      p => (p.studio_id || p.studio) !== auth_user.department_id
    );

    const formatLabel = p =>
      `${p.project_code ? p.project_code + " - " : ""}${p.project_label || p.label}`;

    // Always keep groupedOthers in original order, push to end
    const groupedOthers = studios
      .filter(s => s.id !== auth_user.department_id)
      .map(studio => ({
        label: studio.name,
        options: otherProjects
          .filter(p => (p.studio_id || p.studio) === studio.id)
          .map(p => ({
            ...p,
            label: formatLabel(p),
            value: p.value
          }))
      }))
      .filter(group => group.options.length > 0);

    const groupedList = [];
    if (userStudioProjects.length) {
      groupedList.push({
        label: `${departments.find(d => d.id === auth_user.department_id)?.name || "My Department"} Projects`,
        options: userStudioProjects.map(p => ({
          ...p,
          label: formatLabel(p),
          value: p.value
        }))
      });
    }
    // Always push groupedOthers at the end, regardless of alphabetical order
    groupedList.push(...groupedOthers);

    return groupedList;
  }, [externalProjectOptions, studios, selectedStudios, auth_user, isAllSelected]);

  const CustomMenuList = props => (
    <components.MenuList
      {...props}
      className="!p-0"
    >
      {/* Studio Filter Pills Row */}
      <div className="flex flex-wrap px-2 py-2 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <button
          type="button"
          onClick={() =>
            selectedStudios.length === studios.length
              ? setSelectedStudios([])
              : setSelectedStudios(studios.map(s => s.id))
          }
          className={`px-5 py-1 rounded-full text-xs border ${selectedStudios.length === studios.length ? "bg-primary text-white" : "bg-white hover:bg-gray-100"}`}
        >
          All
        </button>
        {/* Sort studios alphabetically by name */}
        {[...studios]
          .sort((a, b) => {
            if (a.name === "Others") return 1;
            if (b.name === "Others") return -1;
            return a.name.localeCompare(b.name);
          })
          .map(studio => (
            <button
              key={studio.id}
              type="button"
              onClick={e => {
                e.stopPropagation();
                toggleStudio(studio.id);
              }}
              className={`px-2 py-1 rounded-full text-xs border ${selectedStudios.includes(studio.id)
                  ? "bg-primary text-white"
                  : "bg-white hover:bg-gray-100"
                }`}
            >
              {studio.name}
            </button>
          ))}
      </div>

      {/* Then render the rest of the grouped options */}
      {props.children}
    </components.MenuList>
  );

  const CustomLoadingIndicator = (props) => (
    <components.LoadingIndicator {...props}>
      <ReactLoading
        type="bars"
        color="#333"     
        height={22}
        width={22}
      />
    </components.LoadingIndicator>
  );


  const isProjectsExternalLoading = !externalProjectOptions || externalProjectOptions.length === 0;
  const isProjectsInternalLoading = !internalProjectOptions || internalProjectOptions.length === 0;
  const isDepartmentalTasksLoading = !departmentalTaskOptions || departmentalTaskOptions.length === 0;

  const recentExternalInputs = useMemo(() => {
    if (!Array.isArray(events)) return [];
    const today = moment().endOf('day');
    // Filter for external project time charges, only today or before
    const filtered = events.filter(ev =>
      ev.chargeType === "external" &&
      ev.project_id &&
      ev.stage_id &&
      ev.stage_label &&
      ev.start &&
      moment(ev.start).isValid() &&
      moment(ev.start).isSameOrBefore(today) &&
      String(ev.status || "").toLowerCase() !== "declined"
    );
    // Remove duplicates by project_id, stage_id, activity
    const unique = [];
    const seen = new Set();
    for (const ev of filtered) {
      const key = `${ev.project_id}_${ev.stage_id}_${ev.activity}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(ev);
      }
    }
    // Sort by id descending
    unique.sort((a, b) => Number(b.id) - Number(a.id));
    // Limit to 3
    return unique.slice(0, 3).map(ev => ({
      project_id: ev.project_id,
      stage_id: ev.stage_id,
      stage_label: ev.stage_label,
      project_code: ev.project_code,
      project_label: ev.project_label,
      activity: ev.activity,
      id: ev.id,
    }));
  }, [events]);

  const getUserEventsForDay = (date) => {
    return (events || []).filter(ev =>
      moment(ev.start).isSame(date, 'day') &&
      String(ev.status || "").toLowerCase() !== "declined"
    );
  };

  // Update calendarDate if timeFields.start_time changes
  useEffect(() => {
    setCalendarDate(new Date());
  }, []);

  // Helper: check overlap
  const checkOverlap = (start, end, excludeId = null) => {
    return (events || []).some(ev => {
      const status = String(ev.status || "").toLowerCase();
      if (status === "declined") return false;
      if (excludeId && (ev.id === excludeId || ev.originalId === excludeId)) return false;
      const evStart = moment(ev.start);
      const evEnd = moment(ev.end);
      return evStart.isBefore(end) && evEnd.isAfter(start);
    });
  };

  useEffect(() => {
    if (modalStatus === "view") return; // Do not activate in view mode

    let errors = {};
    let warnings = [];
    let start, end;
    let duration = 0;

    if (modalType === "timeCharge") {
      start = moment(timeFields.start_time);
      end = moment(timeFields.end_time);
      duration = getDurationMinutes(start, end);
      // Working hours: 7:00 AM - 7:00 PM, lunch: 12:00 PM - 1:00 PM
      const workStart = start.clone().set({ hour: 7, minute: 0, second: 0 });
      const workEnd = start.clone().set({ hour: 19, minute: 0, second: 0 });
      const lunchStart = start.clone().set({ hour: 12, minute: 0, second: 0 });
      const lunchEnd = start.clone().set({ hour: 13, minute: 0, second: 0 });
      // console.log(timeFields);
      // 1. Validate time fields
      if (!timeFields.start_time || !timeFields.end_time) {
        errors.time = "Start and End time are required.";
      } else if (end.isSameOrBefore(start)) {
        errors.time = "End time must be after Start time.";
      } else if (duration < 15 && !["weekend", "weekend_holiday", "weekday_holiday"].includes(timeFields.ot_type)) {
        errors.duration = "Time charge duration must be at least 15 minutes.";
      } else if (duration > 1440) {
        errors.duration = "Time charge duration cannot exceed 24 hours.";
      }

      // 2. Overlapping events
      if (modalStatus !== "view") {
        const excludeId = modalStatus === "edit" ? timeFields.id : null;
        if (checkOverlap(start, end, excludeId)) {
          errors.overlap = "This time overlaps with another entry.";
        }
      }

      // 3. Working hours and lunch break logic
      // If time charge falls outside working hours
      // if (start.isBefore(workStart) || end.isAfter(workEnd)) {
      //   warnings.push("Some time charge duration falls outside regular working hours.");
      // }

      // Deduct lunch break if event covers lunch
      let lunchDeduct = 0;
      if (start.isBefore(lunchEnd) && end.isAfter(lunchStart)) {
        lunchDeduct = moment.min(end, lunchEnd).diff(moment.max(start, lunchStart), 'minutes');
        duration -= lunchDeduct;
      }

      // Multiple time charges for same day
      const dayEvents = getUserEventsForDay(start);
      const allTimes = [...dayEvents.map(ev => [moment(ev.start), moment(ev.end)]), [start, end]];
      const earliestIn = allTimes.reduce((min, [s]) => s.isBefore(min) ? s : min, start);
      const latestOut = allTimes.reduce((max, [, e]) => e.isAfter(max) ? e : max, end);
      let totalDuration = allTimes.reduce((sum, [s, e]) => sum + getDurationMinutes(s, e), 0);

      // Deduct lunch break once per day
      if (earliestIn.isBefore(lunchEnd) && latestOut.isAfter(lunchStart)) {
        totalDuration -= 60;
      }
      if (totalDuration > 480) {
        // warnings.push("Total time charge for the day exceeds 8 hours.");
      }

      // 4. Overtime logic
      if (timeFields.is_ot) {
        // Only require 8 hours of regular work before OT if not a holiday or weekend
        let adjustedTotalDuration = totalDuration;
        console.log(totalDuration, lunchDeduct);
        if (!["weekday_holiday", "weekend", "weekend_holiday"].includes(timeFields.ot_type)) {
          // console.log("Adjusted total duration:", adjustedTotalDuration);
          // If editing, subtract the current event's duration from total regular hours
          if (modalStatus === "edit" && timeFields.id) {
            // Find the event being edited
            const editingEvent = dayEvents.find(ev => String(ev.id) === String(timeFields.id) || String(ev.originalId) === String(timeFields.id));
            if (editingEvent) {
              const editStart = moment(editingEvent.start);
              const editEnd = moment(editingEvent.end);
              adjustedTotalDuration -= getDurationMinutes(editStart, editEnd);
            }
          }

          const regularEventsCount = dayEvents.filter(ev => !ev.is_ot && !["weekday_holiday", "weekend", "weekend_holiday"].includes(ev.ot_type)).length;

          // if (adjustedTotalDuration < 480 && regularEventsCount > 0) {
          //   errors.ot = "Overtime is only allowed after 8 hours of regular work.";
          // } else 

          // if (regularEventsCount === 0) {
          //   if (adjustedTotalDuration >= 480) {
          //     // console.log("adjusted", adjustedTotalDuration);
          //     if (start.hour() > 10 || (start.hour() === 10 && start.minute() > 0)) {
          //       errors.ot = "Couldn't convert into an overtime.";
          //     }
          //   } else {
          //     errors.ot = "Couldn't convert into an overtime.";
          //   }
          // }
        }
        // Prevent converting a regular event to OT if not allowed
        if (modalStatus === "edit" && !["weekday_holiday", "weekend", "weekend_holiday"].includes(timeFields.ot_type)) {
          // Find the original event
          // const originalEvent = dayEvents.find(ev => String(ev.id) === String(timeFields.id) || String(ev.originalId) === String(timeFields.id));
          // if (originalEvent && !originalEvent.is_ot && timeFields.is_ot) {
          //   console.log(originalEvent, timeFields);
          //   errors.otConvert = "Couldn't convert into an overtime.";
          // }
          // If regular working hours is not yet 8 hours, prevent OT conversion
          if (adjustedTotalDuration < 480) {
            errors.ot = "Overtime is only allowed after 8 hours of regular work.";
          }
        }
        if (duration < 60 && timeFields.is_ot) {
          errors.otDuration = "Overtime duration must be at least 1 hour.";
        }
      }

      // 5. Next Day OT logic
      if (timeFields.next_day_ot) {
        if (!end.isAfter(start, 'day')) {
          errors.nextDayOt = "End time must be on the next day for Next Day OT.";
        }
        if (duration < 60) {
          errors.nextDayOtDuration = "Next Day OT duration must be at least 1 hour.";
        }
        const nextDayLimit = start.clone().add(1, 'day').set({ hour: 7, minute: 0, second: 0 });
        if (end.isAfter(nextDayLimit)) {
          errors.nextDayOtLimit = "Next Day OT must end before 7:00 AM of the next day.";
        }
      }
    } else if (modalType === "leave") {
      start = moment(formLeave.start_time);
      end = moment(formLeave.end_time);
      duration = getDurationMinutes(start, end);

      // 1. Validate time fields
      if (!formLeave.start_time || !formLeave.end_time) {
        errors.time = "Start and End time are required.";
      } else if (end.isSameOrBefore(start)) {
        errors.time = "End time must be after Start time.";
      } else if (duration < 15) {
        errors.duration = "Leave duration must be at least 15 minutes.";
      }

      // 2. Overlapping events  
      if (modalStatus !== "view") {
        if (checkOverlap(start, end)) {
          errors.overlap = "This leave overlaps with another event.";
        }
      }

      // 3. Working hours logic
      const workStart = start.clone().set({ hour: 7, minute: 0, second: 0 });
      const workEnd = start.clone().set({ hour: 19, minute: 0, second: 0 });
      if (start.isBefore(workStart) || end.isAfter(workEnd)) {
        warnings.push("Some leave duration falls outside regular working hours.");
      }

      // Multiple leaves for same day
      const dayEvents = getUserEventsForDay(start);
      const allTimes = [...dayEvents.map(ev => [moment(ev.start), moment(ev.end)]), [start, end]];
      const earliestIn = allTimes.reduce((min, [s]) => s.isBefore(min) ? s : min, start);
      const latestOut = allTimes.reduce((max, [, e]) => e.isAfter(max) ? e : max, end);
      let totalDuration = allTimes.reduce((sum, [s, e]) => sum + getDurationMinutes(s, e), 0);

      // Deduct lunch break once per day
      if (earliestIn.isBefore(start.clone().set({ hour: 13 })) && latestOut.isAfter(start.clone().set({ hour: 12 }))) {
        totalDuration -= 60;
      }
      if (totalDuration > 480) {
        warnings.push("Total leave for the day exceeds 8 hours (excluding lunch).");
      }
    }

    setInputErrors(errors);
    setTimeWarnings(warnings);
  }, [timeFields, formLeave, modalType, modalStatus, events]);
  // VALIDATION AND TIME COMPUTATION LOGIC
  const selectedDate = timeFields?.start_time
    ? moment(timeFields.start_time).format("YYYY-MM-DD")
    : moment().format("YYYY-MM-DD");

  const dailyEvents = useMemo(() => {
    return (events || []).filter(ev => moment(ev.start).format("YYYY-MM-DD") === selectedDate);
  }, [events, selectedDate]);


  if (!show) return null;

  const isFinalStatus = (status) => ["approved", "declined"].includes((status || "").toLowerCase());

  // Helper: get all navigable events (timecharge and leave, not holiday)
  const getNavigableEvents = () => {
    return (events || []).filter(ev => {
      // Only timeCharge or leave, not holidays
      if (ev.type === "timeCharge" || ev.type === "leave") {
        return true;
      }
      return false;
    }).sort((a, b) => new Date(a.start) - new Date(b.start));
  };

  // Find current event index in navigable events
  const getCurrentEventIndex = () => {
    const navEvents = getNavigableEvents();
    if (modalType === "timeCharge") {
      return navEvents.findIndex(ev => ev.type === "timeCharge" && (ev.id === timeFields.id || ev.originalId === timeFields.id));
    } else if (modalType === "leave") {
      return navEvents.findIndex(ev => ev.type === "leave" && ev.id === formLeave.id);
    }
    return -1;
  };

  // Handler for next/previous navigation (fix: always set state from event, not merging with previous)
  const handleNavigateEvent = (direction) => {
    const navEvents = getNavigableEvents();
    const idx = getCurrentEventIndex();
    let newIdx = idx;
    if (direction === "prev") newIdx = idx > 0 ? idx - 1 : idx;
    if (direction === "next") newIdx = idx < navEvents.length - 1 ? idx + 1 : idx;
    if (newIdx === idx || newIdx < 0 || newIdx >= navEvents.length) return;
    const ev = navEvents[newIdx];
    setModalType(ev.type === "timeCharge" ? "timeCharge" : "leave");
    if (ev.type === "timeCharge") {
      // Set all timeFields from event
      setTimeFields({
        id: ev.id,
        start_time: ev.start ? (typeof ev.start === 'string' ? ev.start : moment(ev.start).format("YYYY-MM-DDTHH:mm")) : "",
        end_time: ev.end ? (typeof ev.end === 'string' ? ev.end : moment(ev.end).format("YYYY-MM-DDTHH:mm")) : "",
        is_ot: !!ev.is_ot,
        next_day_ot: !!ev.next_day_ot,
        ot_type: ev.ot_type || "",
        remarks: ev.remarks || "",
        option: ev.option || ev.chargeType || "external"
      });
      setTimeChargeOption(ev.option || ev.chargeType || "external");
      // Set correct form
      if ((ev.option || ev.chargeType) === "external") {
        setFormExternal({
          project_id: ev.project_id || null,
          project_code: ev.project_code || "",
          project_label: ev.project_label || "",
          stage_id: ev.stage_id || null,
          stage_label: ev.stage_label || "",
          activity: ev.activity || "",
          status: ev.status || ""
        });
        setFormInternal({ project_id: null, project_label: "", status: "" });
        setFormDepartmental({ departmental_task_id: null, activity: "", status: "" });
      } else if ((ev.option || ev.chargeType) === "internal") {
        setFormInternal({
          project_id: ev.project_id || null,
          project_label: ev.project_label || "",
          status: ev.status || ""
        });
        setFormExternal({ project_id: null, project_code: "", project_label: "", stage_id: null, stage_label: "", activity: "", status: "" });
        setFormDepartmental({ departmental_task_id: null, activity: "", status: "" });
      } else if ((ev.option || ev.chargeType) === "departmental") {
        setFormDepartmental({
          departmental_task_id: ev.departmental_task_id || null,
          activity: ev.activity || "",
          status: ev.status || ""
        });
        setFormExternal({ project_id: null, project_code: "", project_label: "", stage_id: null, stage_label: "", activity: "", status: "" });
        setFormInternal({ project_id: null, project_label: "", status: "" });
      }
    } else if (ev.type === "leave") {
      setFormLeave({
        id: ev.id || "",
        leave_code: ev.leave_code || "",
        start_time: ev.start ? (typeof ev.start === 'string' ? ev.start : moment(ev.start).format("YYYY-MM-DDTHH:mm")) : "",
        end_time: ev.end ? (typeof ev.end === 'string' ? ev.end : moment(ev.end).format("YYYY-MM-DDTHH:mm")) : "",
        status: ev.status || ""
      });
      setTimeFields({
        id: ev.id || "",
        start_time: ev.start ? (typeof ev.start === 'string' ? ev.start : moment(ev.start).format("YYYY-MM-DDTHH:mm")) : "",
        end_time: ev.end ? (typeof ev.end === 'string' ? ev.end : moment(ev.end).format("YYYY-MM-DDTHH:mm")) : "",
        is_ot: false,
        next_day_ot: false,
        ot_type: "",
        remarks: ev.remarks || "",
        option: undefined
      });
      setFormExternal({ project_id: null, project_code: "", project_label: "", stage_id: null, stage_label: "", activity: "", status: "" });
      setFormInternal({ project_id: null, project_label: "", status: "" });
      setFormDepartmental({ departmental_task_id: null, activity: "", status: "" });
    }
  };

  // Minimal tab navigation for Time Charge / Leave, flexed to start, arrows at end
  const renderTabs = () => {
    const isDisabled = modalType === "timeCharge"
      ? isFinalStatus(formExternal.status || formInternal.status || formDepartmental.status)
      : isFinalStatus(formLeave.status);
    const tabs = [
      { type: "timeCharge", label: "Time Charge" }
      // { type: "leave", label: "Leave" }
    ];
    const navEvents = getNavigableEvents();
    const idx = getCurrentEventIndex();
    return (
      <div className="flex items-center border-b mb-2 justify-between">
        <div className="flex flex-row items-center gap-2">
          {tabs.map(tab => (
            <div
              key={tab.type}
              className={`cursor-pointer px-4 py-2 text-md font-medium transition-colors duration-150 ${modalType === tab.type
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-primary"}
                ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}
              `}
              onClick={() => !isDisabled && setModalType(tab.type)}
              style={{ userSelect: 'none' }}
            >
              {tab.label}
            </div>
          ))}
        </div>
        {/* <div className="flex flex-row items-center gap-1 ml-auto">
          <button
            type="button"
            className={`p-1 rounded-full hover:bg-gray-100 ${idx <= 0 ? "opacity-40 cursor-not-allowed" : ""}`}
            onClick={() => handleNavigateEvent("prev")}
            disabled={idx <= 0}
            tabIndex={-1}
            aria-label="Previous"
          >
            <span className="flex items-center">
              <ArrowLeft size={20} />
              <span className="text-xs text-gray-700 px-1 select-none font-medium">Prev</span>
            </span>
          </button>
          <span className="text-xs text-gray-400 px-1 select-none">/</span>
          <button
            type="button"
            className={`p-1 rounded-full hover:bg-gray-100 ${idx >= navEvents.length - 1 ? "opacity-40 cursor-not-allowed" : ""}`}
            onClick={() => handleNavigateEvent("next")}
            disabled={idx >= navEvents.length - 1}
            tabIndex={-1}
            aria-label="Next"
          >
            <span className="flex items-center">
              <span className="text-xs text-gray-700 px-1 select-none font-medium">Next</span>
              <ArrowRight size={20} />
            </span>
          </button>
        </div> */}
      </div>
    );
  };

  // Minimal tab navigation for time charge options
  const renderTimeChargeTabs = (disableAll) => {
    const tabs = [
      { option: "external", label: "Project External" },
      { option: "internal", label: "Project Internal" },
      { option: "departmental", label: "Departmental Task" }
    ];
    return (
      <div className="flex border-b mb-4">
        {tabs.map(tab => (
          <div
            key={tab.option}
            className={`cursor-pointer px-2 pb-2 text-sm font-bold transition-colors duration-150 ${timeFields.option === tab.option
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-primary"}
              ${disableAll ? "opacity-60 cursor-not-allowed" : ""}
            `}
            onClick={() => !disableAll && (() => {
              setTimeFields(tf => ({ ...tf, option: tab.option }));
              setTimeChargeOption(tab.option);
            })()}
            style={{ userSelect: 'none' }}
          >
            {tab.label}
          </div>
        ))}
      </div>
    );
  };

  const renderRecentActivities = () => {
    if (!recentExternalInputs || recentExternalInputs.length === 0) return null;
    return (
      <div className="mb-2 pb-3 border-b border-gray-200 flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Your recent activities:</span>
        </div>
        <div className="flex flex-wrap gap-2 w-full items-center">
          {recentExternalInputs.map((item, idx) => (
            <button
              key={item.id || idx}
              type="button"
              className="px-3 py-1 rounded bg-gray-100 hover:bg-primary/10 border text-xs text-gray-400 flex flex-col items-start gap-0 w-[180px] min-w-[180px]"
              style={{ lineHeight: '1.1' }}
              title={`${item.project_label} - ${item.stage_label} - ${item.activity}`}
              onClick={() => {
                setFormExternal(fe => ({
                  ...fe,
                  project_id: item.project_id,
                  project_code: item.project_code,
                  project_label: item.project_label,
                  stage_id: item.stage_id,
                  stage_label: item.stage_label,
                  activity: item.activity
                }));
              }}
            >
              <div className="font-semibold flex items-center gap-1 w-full truncate">
                <span className="text-gray-500">{item.project_code}</span>
                <span className="text-gray-700 truncate" style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                  {item.project_label}
                </span>
              </div>
              <div className="text-gray-500 w-full truncate">
                <span>{item.stage_label}</span>
                {" - "}
                <span className="text-gray-400">{item.activity}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Calculate hours for current time charge
  const getCurrentDuration = () => {
    if (!timeFields.start_time || !timeFields.end_time) return { regular: 0, ot: 0 };
    const start = moment(timeFields.start_time);
    const end = moment(timeFields.end_time);
    let duration = getDurationMinutes(start, end, timeFields.is_ot) / 60; // in hours

    // Regular working hours limit
    const regularLimit = 8;
    let regular = Math.min(duration, regularLimit);
    let ot = duration > regularLimit ? duration - regularLimit : 0;

    // OT is only eligible if start is 10:00 AM or earlier
    if (start.hour() > 10 || (start.hour() === 10 && start.minute() > 0) && (start.hour() < 7 || (start.hour() === 7 && start.minute() === 0))) {
      ot = 0;
    }

    return { duration, regular, ot };
  };

  // Minimal time charge form with 2-column layout
  const renderTimeChargeForm = () => {
    const disableAll = isFinalStatus(formExternal.status || formInternal.status || formDepartmental.status);
    // Place this BEFORE the return
    const date = timeFields.start_time
      ? moment(timeFields.start_time).format("YYYY-MM-DD")
      : moment().format("YYYY-MM-DD");

    const totals = {};
    (events || []).forEach(ev => {
      if (ev.type !== "timeCharge" || String(ev.status || "").toLowerCase() === "declined") return;

      const start = moment(ev.start);
      const end = moment(ev.end);
      const key = start.format("YYYY-MM-DD");

      if (!totals[key]) totals[key] = { regular: 0, ot: 0 };

      const duration = getDurationMinutes(start, end) / 60;

      if (ev.is_ot) {
        totals[key].ot += duration;
        return;
      }

      const workStart = start.clone().set({ hour: 7, minute: 0 });
      const workEnd = start.clone().set({ hour: 19, minute: 0 });

      const clampedStart = moment.max(start, workStart);
      const clampedEnd = moment.min(end, workEnd);

      const regular = clampedEnd.isAfter(clampedStart)
        ? getDurationMinutes(clampedStart, clampedEnd) / 60
        : 0;

      totals[key].regular += regular;
    });

    const { regular = 0, ot = 0 } = totals[date] || {};
    // const regHours = Math.min(regular, 8);
    const regHours = regular;
    const otHours = ot;

    // --- Leave hours ---
    const leaveEvents = (events || []).filter(ev =>
      ev.leave_code && moment(ev.start).format("YYYY-MM-DD") === date
    );

    const leaveHours = leaveEvents.reduce((sum, ev) => {
      const start = moment(ev.start);
      const end = moment(ev.end);
      let duration = getDurationMinutes(start, end);

      return sum + Math.max(duration / 60, 0);
    }, 0);

    const leaveTypesArr = Array.from(
      new Set(leaveEvents.map(ev => ev.leave_type || ev.leave_code || "Leave"))
    );

    const status = (formExternal.status || formInternal.status || formDepartmental.status || "").toLowerCase();
    const eventObj = Array.isArray(events) ? events.find(ev =>
      (ev.id === timeFields.id || ev.originalId === timeFields.id)
    ) : undefined;
    const approver = eventObj && staffs && staffs.find(s => String(s.id) === String(eventObj.approver_id));
    const approverName = approver ? approver.first_name + " " + approver.last_name : (eventObj ? `ID ${eventObj.approver_id}` : "-");
    const dateStr = eventObj && eventObj.updated_at ? moment(eventObj.updated_at).format("YYYY-MM-DD HH:mm") : "";

    return (
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-y-auto">
          <div className="flex-1 min-w-0 p-2 flex flex-col">
            <div className="flex-1 overflow-y-auto mb-2">
              <div>
                {renderTimeChargeTabs(disableAll)}
                {timeFields.option === "external" && formExternal.status !== "approved" && recentExternalInputs.length > 0 && renderRecentActivities()}
                {timeFields.option === "external" && (
                  <>
                    <div className="mb-2 px-1">
                      <label className="block text-sm mb-1">Project Name*</label>
                      <GlobalSelect
                        components={{
                          MenuList: CustomMenuList,
                          LoadingIndicator: CustomLoadingIndicator,
                        }}
                        className="w-full text-sm"
                        options={filteredProjects ?? []}
                        // options={externalProjectOptions}
                        isLoading={isProjectsExternalLoading}
                        isDisabled={disableAll}
                        value={
                          externalProjectOptions.find(
                            opt => String(opt.value) === String(formExternal.project_id)
                          ) || null
                        }
                        onChange={opt =>
                          setFormExternal(fe => ({
                            ...fe,
                            project_id: opt ? opt.value : "",
                            project_code: opt ? opt.project_code : "",
                            project_label: opt ? opt.project_label : ""
                          }))
                        }
                        maxMenuHeight={275}
                        placeholder="Select Project"
                        isClearable
                        required
                      />
                    </div>

                    <div className="flex px-1 gap-2 mb-2">
                      <div className="w-1/2">
                        <label className="block text-sm mb-1">Project Stage*</label>
                        <GlobalSelect
                          options={externalProjectStages}
                          isDisabled={disableAll}
                          value={externalProjectStages.find(opt => String(opt.value) === String(formExternal.stage_id)) || null}
                          onChange={opt =>
                            setFormExternal(fe => ({
                              ...fe,
                              stage_id: opt ? opt.value : "",
                              stage_label: opt ? opt.stage_label : ""
                            }))
                          }
                          maxMenuHeight={200}
                          placeholder="Select Stage"
                          isClearable
                          required
                        />
                      </div>

                      <div className="w-1/2">
                        <label className="block text-sm mb-1">Activity*</label>
                        <GlobalSelect
                          className="w-full text-sm"
                          options={activities.map(a => ({ value: a, label: a }))}
                          isDisabled={disableAll}
                          value={formExternal.activity ? { value: formExternal.activity, label: formExternal.activity } : null}
                          onChange={opt =>
                            setFormExternal(fc => ({
                              ...fc,
                              activity: opt ? opt.value : ""
                            }))
                          }
                          placeholder="Select Activity"
                          maxMenuHeight={200}
                          isClearable
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {timeFields.option === "internal" && (
                  <div className="mb-2 px-1">
                    <label className="block text-sm mb-1">Project Name*</label>
                    <GlobalSelect
                      components={{
                        LoadingIndicator: CustomLoadingIndicator,
                      }}
                      className="w-full text-sm"
                      options={internalProjectOptions}
                      isLoading={isProjectsInternalLoading}
                      isDisabled={disableAll}
                      value={internalProjectOptions.find(opt => String(opt.value) === String(formInternal.project_id)) || null}
                      onChange={opt =>
                        setFormInternal(fi => ({
                          ...fi,
                          project_id: opt ? opt.value : "",
                          project_label: opt ? opt.project_label : ""
                        }))
                      }
                      placeholder="Select Project"
                      isClearable
                      required
                    />
                  </div>
                )}

                {timeFields.option === "departmental" && (
                  <div className="mb-2 px-1">
                    <label className="block text-sm mb-1">Task Name*</label>
                    <GlobalSelect
                      components={{
                        LoadingIndicator: CustomLoadingIndicator,
                      }}
                      className="w-full text-sm"
                      options={departmentalTaskOptions}
                      isLoading={isDepartmentalTasksLoading}
                      isDisabled={disableAll}
                      value={departmentalTaskOptions.find(opt => String(opt.value) === String(formDepartmental.departmental_task_id)) || null}
                      onChange={opt =>
                        setFormDepartmental(fd => ({
                          ...fd,
                          departmental_task_id: opt ? opt.value : "",
                          activity: opt ? opt.task_name : ""
                        }))
                      }
                      placeholder="Select Task"
                      isClearable
                      required
                    />
                  </div>
                )}

                <div className="flex gap-2 px-1 mb-2">
                  <div className="w-1/2">
                    <label className="block text-sm mb-1">Start Time*</label>
                    <input
                      type="datetime-local"
                      className={`w-full rounded p-2 text-sm text-gray-700 placeholder:text-gray-400 border border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400`}
                      value={timeFields.start_time}
                      onChange={e => setTimeFields(tf => ({ ...tf, start_time: e.target.value }))}
                      disabled={disableAll}
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-sm mb-1">End Time*</label>
                    <input
                      type="datetime-local"
                      className={`w-full rounded p-2 text-sm text-gray-700 placeholder:text-gray-400 border border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400`}
                      value={timeFields.end_time}
                      onChange={e => setTimeFields(tf => ({ ...tf, end_time: e.target.value }))}
                      disabled={disableAll}
                    />
                  </div>
                </div>

                <div className="mb-4 px-1 flex items-center gap-4">
                  <label htmlFor="otDept" className="flex items-center cursor-pointer">
                    <span className="mr-2 text-sm">Overtime</span>
                    <input
                      type="checkbox"
                      id="otDept"
                      checked={timeFields.is_ot || ["weekday_holiday", "weekend", "weekend_holiday"].includes(timeFields.ot_type)}
                      onChange={e => {
                        if (!timeFields.is_ot && !e.target.checked) return;
                        setTimeFields(tf => ({
                          ...tf,
                          is_ot: e.target.checked,
                          next_day_ot: e.target.checked ? tf.next_day_ot : false,
                        }));
                      }}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary rounded cursor-pointer"
                      disabled={disableAll}
                    />
                  </label>
                  {/* {(modalStatus === "view" ? !!timeFields.is_ot : timeFields.is_ot) && (
                    <label htmlFor="nextDayOtDept" className="flex items-center cursor-pointer">
                      <span className="mr-2 text-sm">Next Day OT</span>
                      <input
                        type="checkbox"
                        id="nextDayOtDept"
                        checked={timeFields.next_day_ot}
                        onChange={e => {
                          if (!timeFields.is_ot) return;
                          setTimeFields(tf => ({ ...tf, next_day_ot: e.target.checked }));
                        }}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary rounded cursor-pointer"
                        disabled={disableAll}
                      />
                    </label>
                  )} */}
                </div>

                <div className="mt-2 pt-2 border-t px-1 border-gray-200">
                  <label className="block text-sm mb-1">Remarks</label>
                  <textarea
                    className={`w-full rounded text-sm text-gray-700 placeholder:text-gray-400 border border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 mb-2`}
                    rows={2.5}
                    value={timeFields.remarks}
                    onChange={e => setTimeFields(tf => ({ ...tf, remarks: e.target.value }))}
                    disabled={disableAll}
                    placeholder="What did you work on?"
                  />
                </div>

              </div>
            </div>

            {/* Fixed bottom summary */}
            <div
              className={`text-sm leading-tight mt-auto p-2 border-y flex items-center justify-between gap-2 w-full overflow-x-auto whitespace-nowrap
              ${{
                  approved: "border-green-200 bg-green-100",
                  declined: "border-red-200 bg-red-100",
                  pending: "border-yellow-200 bg-yellow-100",
                }[
                (formExternal.status || formInternal.status || formDepartmental.status || "pending").toLowerCase()
                ]
                }`}
            >
              {/* Left side — This Entry */}
              <div className="font-semibold text-gray-700 truncate flex items-center gap-1 flex-shrink-0">
                <TimerIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-500">This Entry:</span>
                <span>{(getCurrentDuration()?.duration ?? 0).toFixed(2)} hours</span>
              </div>

              {/* Right side — Status, Errors or Warnings */}
              <div className="flex items-center gap-2 min-w-0 flex-shrink">
                {Object.keys(inputErrors).length > 0 ? (
                  <div className="text-red-500 text-sm flex items-center gap-1 truncate">
                    <CircleX className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{Object.values(inputErrors)[0]}</span>
                  </div>
                ) : timeWarnings.length > 0 ? (
                  <div className="text-yellow-500 text-sm flex items-center gap-1 truncate">
                    <CircleAlert className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{timeWarnings[0]}</span>
                  </div>
                ) : (() => {
                  const status =
                    (formExternal.status || formInternal.status || formDepartmental.status || "").trim();
                  const eventObj = Array.isArray(events)
                    ? events.find(
                      (ev) => ev.id === timeFields.id || ev.originalId === timeFields.id
                    )
                    : undefined;
                  const approver =
                    eventObj && staffs?.find((s) => String(s.id) === String(eventObj.approver_id));
                  const approverName = approver
                    ? `${approver.first_name} ${approver.last_name}`
                    : eventObj?.approver_id
                      ? `ID ${eventObj.approver_id}`
                      : "";

                  if (status) {
                    const statusIcon =
                      status.toLowerCase() === "approved" ? (
                        <CheckCircle2 className="inline w-3 h-3 mr-1 mb-0.5 text-gray-500" />
                      ) : status.toLowerCase() === "declined" ? (
                        <XCircle className="inline w-3 h-3 mr-1 mb-0.5 text-gray-500" />
                      ) : (
                        <Hourglass className="inline w-3 h-3 mr-1 mb-0.5 text-gray-500" />
                      );

                    return (
                      <div className="flex gap-4 items-center text-xs text-gray-500 font-medium truncate">
                        <span className="flex items-center truncate">
                          {statusIcon}
                          Status:
                          <span className="ml-1 font-semibold text-gray-700 truncate">
                            {status.toLowerCase() === "pending"
                              ? "For Approval"
                              : status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </span>
                        {/* <span className="flex items-center truncate">
                          <UserRoundPenIcon className="inline w-3 h-3 mr-1 mb-0.5" />
                          Approver:
                          <span className="ml-1 font-semibold text-gray-700 truncate">
                            {approverName}
                          </span>
                        </span> */}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

          </div>

          {/* Right column: Date & hours, then calendar */}
          <div className="flex flex-col gap-4 w-full md:w-[340px] min-w-[260px]">
            <div className="flex flex-col gap-2 w-full md:w-[340px] min-w-[260px]">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">
                  {timeFields.start_time
                    ? moment(timeFields.start_time).format("dddd, MMMM DD, YYYY")
                    : "No date selected"}
                </span>
              </div>
              <div>
                {renderTimeGrid()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with total hours, buttons, and error status */}
        <div className="pl-2 pt-2 pb-4 flex items-center justify-between gap-4">
          {/* Center: Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {loading ? (
              <div className="flex justify-center">
                <ReactLoading type="bars" color="#888888" height={40} width={40} />
              </div>
            ) : (
              <>
                {!disableAll && (
                  <button type="submit" className="px-8 py-2 bg-primary text-white text-sm rounded-full hover:opacity-90 transition-opacity">
                    Save
                  </button>
                )}

                {modalStatus === "edit" && (formExternal.status || formInternal.status || formDepartmental.status || "").toLowerCase() !== "approved" && (
                  <button
                    type="button"
                    className="px-4 py-2 bg-red-500 text-sm text-white rounded-full hover:bg-red-600 transition-colors"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await api("time_charge_delete", { ...headerReq, id: timeFields.id });
                        setEvents(prevEvents =>
                          prevEvents.filter(ev =>
                            String(ev.id) !== String(timeFields.id) && String(ev.originalId) !== String(timeFields.id)
                          ));
                        onClose();
                      } catch (err) {
                        // console.error(err);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={disableAll}
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right: Total Hours */}
          <div className="flex items-center border bg-white text-xs text-gray-700 py-2 px-2 rounded-full ml-auto justify-end w-auto max-w-full">
            <div className="flex items-center gap-1">
              <CalendarClock className="text-gray-500 w-4 h-4" />
              <span className="font-semibold text-gray-700">{(regHours + otHours).toFixed(2)}h</span>
              <span className="text-gray-500">Total</span>
              <span className="text-gray-300 mx-1">|</span>
              <span className="font-semibold text-green-600">{regHours.toFixed(2)}h</span>
              <span className="text-gray-500">Reg</span>
              <span className="text-gray-300 mx-1">|</span>
              <span className="font-semibold text-orange-600">{otHours.toFixed(2)}h</span>
              <span className="text-gray-500">OT</span>
              <span className="text-gray-300 mx-1">|</span>
              <span className="font-semibold text-blue-600">{leaveHours.toFixed(2)}h</span>
              <span className="text-gray-500">Leave</span>
              {/* {leaveTypesArr.length > 0 && (
                    <span className="text-gray-400">({leaveTypesArr.join(", ")})</span>
                  )} */}
            </div>
          </div>
        </div>
      </form>
    );
  };

  // // Calculate hours for current leave
  // const getCurrentLeaveDuration = () => {
  //   if (!timeFields.start_time || !timeFields.end_time) return 0;
  //   const start = moment(timeFields.start_time);
  //   const end = moment(timeFields.end_time);
  //   let duration = getDurationMinutes(start, end);
  //   // Deduct lunch break if event covers lunch
  //   const lunchStart = start.clone().set({ hour: 12, minute: 0, second: 0 });
  //   const lunchEnd = start.clone().set({ hour: 13, minute: 0, second: 0 });
  //   if (start.isBefore(lunchEnd) && end.isAfter(lunchStart)) {
  //     const lunchDeduct = moment.min(end, lunchEnd).diff(moment.max(start, lunchStart), 'minutes');
  //     duration -= lunchDeduct;
  //   }
  //   return Math.max(duration / 60, 0);
  // };

  // // Minimal leave form with 2-column layout
  // const renderLeaveForm = () => {
  //   const disableLeave = isFinalStatus(formLeave.status);
  //   return (
  //     <form onSubmit={handleSubmit} className="flex flex-col h-full">
  //       <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-y-auto">
  //         <div className="flex-1 min-w-0">
  //           <div className="mb-2">
  //             <label className="block text-sm mb-1">Leave Type</label>
  //             <GlobalSelect
  //               options={leaveTypes.map(l => ({ value: l, label: l }))}
  //               value={formLeave.leave_code ? { value: formLeave.leave_code, label: formLeave.leave_code } : null}
  //               onChange={opt => setFormLeave(fl => ({ ...fl, leave_code: opt ? opt.value : "" }))}
  //               placeholder="Select Leave Type"
  //               isClearable
  //               isDisabled={disableLeave}
  //             />
  //           </div>
  //           <div className="flex gap-2 mb-2">
  //             <div className="w-1/2">
  //               <label className="block text-sm mb-1">Start Time</label>
  //               <input
  //                 type="datetime-local"
  //                 className="w-full border rounded p-2"
  //                 value={timeFields.start_time}
  //                 onChange={e => setTimeFields(tf => ({ ...tf, start_time: e.target.value }))}
  //                 disabled={disableLeave}
  //               />
  //             </div>
  //             <div className="w-1/2">
  //               <label className="block text-sm mb-1">End Time</label>
  //               <input
  //                 type="datetime-local"
  //                 className="w-full border rounded p-2"
  //                 value={timeFields.end_time}
  //                 onChange={e => setTimeFields(tf => ({ ...tf, end_time: e.target.value }))}
  //                 disabled={disableLeave}
  //               />
  //             </div>
  //           </div>
  //           <div className="mb-2">
  //             <label className="block text-sm mb-1">Reason</label>
  //             <input
  //               type="text"
  //               className="w-full border rounded p-2"
  //               value={formLeave.status}
  //               onChange={e => setFormLeave(fl => ({ ...fl, status: e.target.value }))}
  //               disabled={disableLeave}
  //             />
  //           </div>
  //         </div>
  //         {/* Right column: Date & hours, then calendar */}
  //         <div className="flex flex-col gap-2 w-full md:w-[340px] min-w-[260px]">
  //           {/* Date and Total Hours */}
  //           <div className="flex flex-row justify-between items-center text-xs text-gray-700 mb-2 font-semibold border-b pb-1">
  //             <div className="flex-1 text-left">
  //               {/* <span className="block text-[11px] text-gray-500 font-semibold">Date</span> */}
  //               {timeFields.start_time
  //                 ? `${moment(timeFields.start_time).format("ddd")}, ${moment(timeFields.start_time).format("MMM DD, YYYY")}`
  //                 : "-"}
  //             </div>
  //             <div className="flex-1 text-right">
  //               <span className="block text-[11px] text-gray-500 font-semibold">Total Hours</span>
  //               {(() => {
  //                 const date = timeFields.start_time ? moment(timeFields.start_time).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD");
  //                 // Custom calculation: Only count OT if is_ot is true, not just after 7pm
  //                 const totals = {};
  //                 (events || []).forEach(ev => {
  //                   if (ev.type !== "timeCharge") return;
  //                   if (ev.status && ev.status.toLowerCase() === "declined") return;

  //                   const start = moment(ev.start);
  //                   const end = moment(ev.end);
  //                   const key = start.format("YYYY-MM-DD");

  //                   if (!totals[key]) {
  //                     totals[key] = { regular: 0, ot: 0 };
  //                   }

  //                   // If event is marked as OT (is_ot true), count all duration as OT
  //                   if (ev.is_ot) {
  //                     const otDuration = getDurationMinutes(start, end) / 60;
  //                     totals[key].ot += otDuration;
  //                     return;
  //                   }

  //                   // Define working hours: 7am–7pm
  //                   const workStart = start.clone().set({ hour: 7, minute: 0, second: 0 });
  //                   const workEnd = start.clone().set({ hour: 19, minute: 0, second: 0 });

  //                   // Clamp start and end times to within working window
  //                   const clampedStart = moment.max(start, workStart);
  //                   const clampedEnd = moment.min(end, workEnd);

  //                   let regular = 0;
  //                   if (clampedEnd.isAfter(clampedStart)) {
  //                     regular = getDurationMinutes(clampedStart, clampedEnd) / 60;
  //                   }
  //                   // Add to totals
  //                   totals[key].regular += regular;
  //                 });
  //                 const { regular = 0, ot = 0 } = totals[date] || {};

  //                 // Sum leave hours and collect leave types for the day
  //                 const leaveEvents = (events || []).filter(ev =>
  //                   ev.leave_code && moment(ev.start).format("YYYY-MM-DD") === date
  //                 );
  //                 const leaveHours = leaveEvents.reduce((sum, ev) => {
  //                   const start = moment(ev.start);
  //                   const end = moment(ev.end);
  //                   let duration = getDurationMinutes(start, end);
  //                   // Deduct lunch break if event covers lunch
  //                   const lunchStart = start.clone().set({ hour: 12, minute: 0, second: 0 });
  //                   const lunchEnd = start.clone().set({ hour: 13, minute: 0, second: 0 });
  //                   if (start.isBefore(lunchEnd) && end.isAfter(lunchStart)) {
  //                     const lunchDeduct = moment.min(end, lunchEnd).diff(moment.max(start, lunchStart), 'minutes');
  //                     duration -= lunchDeduct;
  //                   }
  //                   return sum + Math.max(duration / 60, 0);
  //                 }, 0);
  //                 const leaveTypesArr = Array.from(new Set(leaveEvents.map(ev => ev.leave_type || ev.leave_code || "Leave")));
  //                 // If event is later than 7pm, it doesn't mean that it is already an overtime. There is an is_ot true to identify that it is an overtime.
  //                 const regHours = Math.min(regular, 8);
  //                 const otHours = ot;
  //                 return (
  //                   <span>
  //                     <span className="font-semibold">Regular:</span> {regHours.toFixed(2)} h | <span className="font-semibold">OT:</span> {otHours.toFixed(2)} h
  //                     {leaveHours > 0 && (
  //                       <span className="block text-[11px] text-blue-500 font-semibold mt-1">
  //                         Leave: {leaveHours.toFixed(2)} h {leaveTypesArr.length > 0 && `(${leaveTypesArr.join(", ")})`}
  //                       </span>
  //                     )}
  //                   </span>
  //                 );
  //               })()}
  //             </div>
  //           </div>

  //           <div>
  //             {/* <span className="block text-[11px] text-gray-500 font-medium mb-1">Day Timeline</span> */}
  //             {renderTimeGrid()}
  //           </div>
  //         </div>
  //       </div>

  //       {/* Footer with total hours, buttons, and error status */}
  //       <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between gap-4">
  //         {/* Left: Total Hours */}
  //         <div className="flex items-center gap-2 min-w-0">
  //           <Clock className="w-5 h-5 text-gray-500 flex-shrink-0" />
  //           <div className="text-sm">
  //             <span className="text-gray-500 font-medium">Total Hours:</span>
  //             <span className="ml-2 font-semibold text-gray-800">
  //               {getCurrentLeaveDuration().toFixed(2)}h
  //             </span>
  //           </div>
  //         </div>

  //         {/* Center: Action Buttons */}
  //         <div className="flex items-center gap-2 flex-shrink-0">
  //           {loading ? (
  //             <div className="flex justify-center">
  //               <Bars height="40" width="40" color="#251D5C" visible />
  //             </div>
  //           ) : (
  //             <>
  //               {modalStatus === "edit" && !disableLeave && (formLeave.status || "").toLowerCase() !== "approved" && (
  //                 <button
  //                   type="button"
  //                   className="px-4 py-2 bg-red-500 text-white text-sm rounded-full hover:bg-red-600 transition-colors"
  //                   onClick={async () => {
  //                     setLoading(true);
  //                     try {
  //                       await api("leave_delete", { ...headerReq, id: formLeave.id });
  //                       setEvents(prevEvents => prevEvents.filter(ev => String(ev.id) !== String(formLeave.id)));
  //                       onClose();
  //                     } catch (err) {
  //                       console.error(err);
  //                     } finally {
  //                       setLoading(false);
  //                     }
  //                   }}
  //                 >
  //                   Delete
  //                 </button>
  //               )}
  //               {!disableLeave && <button type="submit" className="px-8 py-2 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition-colors">Submit</button>}
  //             </>
  //           )}
  //         </div>

  //         {/* Right: Error/Warning Status */}
  //         <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
  //           {Object.keys(inputErrors).length > 0 && (
  //             <div className="text-red-500 text-sm flex items-center gap-2">
  //               <CircleX className="w-5 h-5 flex-shrink-0" />
  //               <span className="truncate">{Object.values(inputErrors)[0]}</span>
  //             </div>
  //           )}
  //           {Object.keys(inputErrors).length === 0 && timeWarnings.length > 0 && (
  //             <div className="text-yellow-500 text-sm flex items-center gap-2">
  //               <CircleAlert className="w-5 h-5 flex-shrink-0" />
  //               <span className="truncate">{timeWarnings[0]}</span>
  //             </div>
  //           )}
  //         </div>
  //       </div>
  //     </form>
  //   );
  // };

  function getDayTotals(date) {
    let regular = 0;
    let ot = 0;
    (events || []).forEach(ev => {
      if (!ev.start || !ev.end) return;
      if (moment(ev.start).format("YYYY-MM-DD") !== date) return;
      const isOT = ev.is_ot || ["weekday_holiday", "weekend", "weekend_holiday"].includes(ev.ot_type);
      let start = moment(ev.start);
      let end = moment(ev.end);
      // Only count regular time between 7am and 7pm
      const regStart = start.clone().set({ hour: 7, minute: 0, second: 0 });
      const regEnd = start.clone().set({ hour: 19, minute: 0, second: 0 });
      // If OT, all time is OT
      if (isOT) {
        ot += getDurationMinutes(start, end) / 60;
      } else {
        // Regular time only between 7am-7pm
        if (end.isBefore(regStart) || start.isAfter(regEnd)) {
          // All outside regular hours, skip for regular
          ot += getDurationMinutes(start, end) / 60;
        } else {
          // Clamp to 7am-7pm for regular
          const regClampedStart = moment.max(start, regStart);
          const regClampedEnd = moment.min(end, regEnd);
          if (regClampedEnd.isAfter(regClampedStart)) {
            regular += getDurationMinutes(regClampedStart, regClampedEnd) / 60;
          }
          // If any time outside 7am-7pm, count as OT
          if (start.isBefore(regStart)) {
            ot += getDurationMinutes(start, regClampedStart) / 60;
          }
          if (end.isAfter(regEnd)) {
            ot += getDurationMinutes(regClampedEnd, end) / 60;
          }
        }
      }
    });
    return { regular, ot };
  }

  const localizer = momentLocalizer(moment);

  const renderTimeGrid = () => {
    // Prepare events for the calendar
    const calendarEvents = dailyEvents
      .filter(ev => !(ev.id === timeFields.id || ev.originalId === timeFields.id))
      .map(ev => ({
        id: ev.id,
        title: ev.title || ev.activity || "Event",
        start: new Date(ev.start),
        end: new Date(ev.end),
        allDay: false,
        isCurrent: false,
        status: ev.status,
        is_ot: ev.is_ot || false,
        next_day_ot: ev.next_day_ot || false,
        chargeType: ev.chargeType || "",
        stage_label: ev.stage_label || "",
        activity: ev.activity || "",
        type: ev.type || "timeCharge",
      }));

    // Add the current editable event (only once)
    if (timeFields.start_time && timeFields.end_time) {
      calendarEvents.push({
        id: "current",
        title: timeFields.option === "external"
          ? formExternal.project_label || formExternal.activity || "Editing"
          : timeFields.option === "internal"
            ? formInternal.project_label || "Editing"
            : timeFields.option === "departmental"
              ? formDepartmental.activity || "Editing"
              : "Editing",
        start: new Date(timeFields.start_time),
        end: new Date(timeFields.end_time),
        allDay: false,
        isCurrent: true,
        is_ot: timeFields.is_ot || false,
        next_day_ot: timeFields.next_day_ot || false,
        status: (() => {
          const status =
            timeFields.option === "external"
              ? formExternal.status
              : timeFields.option === "internal"
                ? formInternal.status
                : timeFields.option === "departmental"
                  ? formDepartmental.status
                  : "";
          return (status && status.toLowerCase() === "pending") ? "" : status;
        })(),
        stage_label: (() => {
          return timeFields.option === "external"
            ? formExternal.stage_label
            : timeFields.option === "internal"
              ? formInternal.stage_label
              : timeFields.option === "departmental"
                ? formDepartmental.stage_label
                : "";
        })(),
        activity: timeFields.activity || "",
        chargeType:
          timeFields.option === "external"
            ? "external"
            : timeFields.option === "internal"
              ? "internal"
              : timeFields.option === "departmental"
                ? "departmental"
                : "",
        type: "timeCharge",
      });
    }

    // Only show the selected date
    const date = timeFields?.start_time
      ? new Date(timeFields.start_time)
      : new Date();

    // Helper to check if status is final
    const isFinalStatus = status =>
      ["approved", "declined"].includes((status || "").toLowerCase());

    // Determine if dragging/resizing should be disabled
    const disableDragResize =
      modalType === "timeCharge"
        ? isFinalStatus(formExternal.status || formInternal.status || formDepartmental.status)
        : isFinalStatus(formLeave.status);

    // Handle slot selection to update timeFields
    const handleSelectSlot = ({ start, end }) => {
      if (disableDragResize) return;
      setTimeFields(tf => ({
        ...tf,
        start_time: moment(start).format("YYYY-MM-DDTHH:mm"),
        end_time: moment(end).format("YYYY-MM-DDTHH:mm"),
        is_ot: false,
        next_day_ot: false,
        remarks: typeof tf.remarks === 'string' ? tf.remarks : ""
      }));
    };

    // Handle event resize
    const handleEventResize = ({ event, start, end }) => {
      // if (disableDragResize) return;
      if (event.id === "current") {
        setTimeFields(tf => ({
          ...tf,
          start_time: moment(start).format("YYYY-MM-DDTHH:mm"),
          end_time: moment(end).format("YYYY-MM-DDTHH:mm"),
          is_ot: event.is_ot,
          next_day_ot: event.next_day_ot,
          remarks: typeof tf.remarks === 'string' && tf.remarks !== '' ? tf.remarks : (event.remarks || "")
        }));
      }
    };

    // Handle event drag
    const handleEventDrop = ({ event, start, end }) => {
      // if (disableDragResize) return;
      if (event.id === "current") {
        setTimeFields(tf => ({
          ...tf,
          start_time: moment(start).format("YYYY-MM-DDTHH:mm"),
          end_time: moment(end).format("YYYY-MM-DDTHH:mm"),
          is_ot: event.is_ot,
          next_day_ot: event.next_day_ot,
          remarks: typeof tf.remarks === 'string' && tf.remarks !== '' ? tf.remarks : (event.remarks || "")
        }));
      }
    };

    return (
      <div className="hidden md:block w-auto max-h-[500px] overflow-y-auto relative">
        <DragAndDropCalendar
          localizer={localizer}
          events={calendarEvents}
          // view={Views.DAY}
          defaultView={Views.DAY}
          date={date}
          toolbar={false}
          min={moment(date).startOf("day").toDate()}
          max={moment(date).endOf("day").toDate()}
          step={15}
          timeslots={4}
          style={{ height: 500 }}
          selectable={!disableDragResize}
          onSelectSlot={handleSelectSlot}
          // onSelectEvent={(event) => console.log("cklicked")}
          resizable={!disableDragResize}
          onEventResize={handleEventResize}
          onEventDrop={handleEventDrop}
          onNavigate={date => setCalendarDate(date)}
          draggableAccessor={event =>
            !disableDragResize && event.isCurrent
          }
          resizableAccessor={event =>
            !disableDragResize && event.isCurrent
          }
          components={{
            event: (props) => <EventCustomizer {...props} setInputErrors={setInputErrors} />,
            timeHeader: () => null
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
          formats={{
            timeGutterFormat: (date, culture, localizer) =>
              localizer.format(date, "h A", culture),
          }}
        />
        <style>
          {`
        .rbc-time-header, .rbc-overflowing {
          display: none !important;
        }

        .rbc-addons-dnd-resize-ns-icon {
          width: 18px;              
          height: 5px;
          background-color: black;
          display: inline-block;
        }
        
        .rbc-label {
          font-size: 12px;
        }
        `}
        </style>
      </div>
    );
  };

  // Helper to get modal title (minimal)
  const getModalTitle = () => {
    let action = "";
    if (modalStatus === "create") action = "New";
    else if (modalStatus === "edit" || (formExternal.status || formInternal.status || formDepartmental.status || "").toLowerCase() === "pending") action = "Edit";
    else if (modalStatus === "view" && (formExternal.status || formInternal.status || formDepartmental.status || "").toLowerCase() !== "pending") action = "View";
    else action = "";
    let type = "";
    if (modalType === "timeCharge") type = "Time Charge";
    else if (modalType === "leave") type = "Leave";
    else type = "";
    return `${action}${type ? " - " + type : ""}`;
  };

  // Minimal, modern modal layout
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl md:max-w-4xl xl:max-w-5xl relative overflow-hidden max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-semibold tracking-tight">{getModalTitle()}</h2>
          <button className="text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="px-4 pt-2 flex-1 overflow-y-auto min-h-0">
          {renderTabs()}
          <div className="flex flex-col h-full">
            {/* {modalType === "timeCharge" ? renderTimeChargeForm() : renderLeaveForm()} */}
            {modalType === "timeCharge" ? renderTimeChargeForm() : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;