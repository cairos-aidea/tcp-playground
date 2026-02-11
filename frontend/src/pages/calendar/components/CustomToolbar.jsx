import { ChevronLeft, ChevronRight, Filter } from "lucide-react";

const CustomToolbar = ({ userHireDate, events, date, label, localizer, onNavigate, onView, views, view, children, showSidebarOptions, setShowSidebarOptions, isMobile }) => {
  // Helper functions
  const isWeekday = (d) => {
    const day = d.getDay();
    return day !== 0 && day !== 6;
  };

  // Calculate duration for a single event, considering 7am-7pm window and lunch break
  const calculateDuration = (start, end) => {
    let startDate = new Date(start);
    let endDate = new Date(end);

    // Clamp start to 7:00 AM if earlier, and end to 7:00 PM if later
    const dayStart = new Date(startDate);
    dayStart.setHours(7, 0, 0, 0);
    const dayEnd = new Date(startDate);
    dayEnd.setHours(19, 0, 0, 0);

    if (startDate < dayStart) startDate = new Date(dayStart);
    if (endDate > dayEnd) endDate = new Date(dayEnd);
    if (endDate <= startDate) return 0;

    // Lunch break window
    const lunchStart = new Date(startDate);
    lunchStart.setHours(11, 30, 0, 0);
    const lunchEnd = new Date(startDate);
    lunchEnd.setHours(12, 30, 0, 0);

    // Calculate overlap with lunch
    let overlap = 0;
    if (startDate < lunchEnd && endDate > lunchStart) {
      const overlapStart = new Date(Math.max(startDate.getTime(), lunchStart.getTime()));
      const overlapEnd = new Date(Math.min(endDate.getTime(), lunchEnd.getTime()));
      overlap = Math.max(0, (overlapEnd - overlapStart) / (1000 * 60 * 60));
    }

    let duration = (endDate - startDate) / (1000 * 60 * 60) - overlap;
    return Math.max(0, duration);
  };

  // Get range for current view
  const getViewRange = (date, view) => {
    const d = new Date(date);
    if (view === "month") {
      return {
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
      };
    }
    if (view === "week") {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    }
    // day view
    return { start: new Date(d), end: new Date(d) };
  };

  // Should show stats for this period?
  const shouldShowStats = (range) => {
    const today = new Date();
    const setDate = new Date(2025, 10, 10); // Nov 10, 2025
    // Only show for periods that include or are after Nov 10, 2025, up to today
    return range.end >= setDate && range.start <= today;
  };

  // Compute stats for a given range
  const computeStats = ({ events, userHireDate, range }) => {
    let start = new Date(range.start);
    let end = new Date(range.end);

    // Clamp start to Nov 10, 2025 for month view if needed
    const statsStartDate = new Date(2025, 10, 10); // Nov 10, 2025
    if (view === "month" && start < statsStartDate && end >= statsStartDate) {
      start = new Date(statsStartDate);
    }

    // Adjust for hire date
    if (userHireDate) {
      const hireDate = new Date(userHireDate);
      if (hireDate > start && hireDate <= end) {
        start = new Date(hireDate);
      }
      if (hireDate > end) {
        return { upToDate: true };
      }
    }

    const today = new Date();
    if (start > today) return { upToDate: true };

    // Clamp end to yesterday if current period
    if (
      end.getFullYear() === today.getFullYear() &&
      end.getMonth() === today.getMonth() &&
      end.getDate() >= today.getDate()
    ) {
      end = new Date(today);
      end.setDate(today.getDate() - 1);
    }

    // Collect holidays in range
    const holidays = events
      .filter(
        (e) =>
          e.type === "holiday" &&
          new Date(e.start) >= start &&
          new Date(e.start) <= end
      )
      .map((e) => new Date(e.start).toDateString());

    // Only regular time charges (is_ot !== true)
    const timeCharges = events.filter(
      (e) => {
        if (e.type !== "timeCharge" || e.status === "declined" || e.is_ot === true) return false;
        const eventDate = new Date(e.start);
        eventDate.setHours(0, 0, 0, 0);
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(end);
        endDate.setHours(0, 0, 0, 0);
        return eventDate >= startDate && eventDate <= endDate;
      }
    );

    // Group time charge events by day
    const eventsByDay = {};
    timeCharges.forEach((e) => {
      const dayStr = new Date(e.start).toDateString();
      if (!eventsByDay[dayStr]) eventsByDay[dayStr] = [];
      eventsByDay[dayStr].push(e);
    });

    // Only include leave events for the same month as 'start'
    const leaveEvents = events.filter(
      (e) =>
      e.type === "leave" &&
      new Date(e.start).getFullYear() === start.getFullYear() &&
      new Date(e.start).getMonth() === start.getMonth()
    );

    // console.log("Leave events in range:", leaveEvents);

    const leaveDurationsByDay = {};
    leaveEvents.forEach((e) => {
      const dayStr = new Date(e.start).toDateString();
      const dur = calculateDuration(e.start, e.end);
      const status = e.status === 0 || e.status === 4 ? "approved" : e.status;
      if (!leaveDurationsByDay[dayStr]) leaveDurationsByDay[dayStr] = { approved: 0, pending: 0 };
      if (status === "approved" || e.status === 0) {
        leaveDurationsByDay[dayStr].approved += dur;
      } else if (status === "pending") {
        leaveDurationsByDay[dayStr].pending += dur;
      }
    });

    let totalNeededHours = 0;
    let missingHours = 0;
    let pendingHours = 0;
    let cursor = new Date(start);

    // Detect if this is a single day view
    // Compare only the date parts (ignore time)
    const isSingleDay = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth() && start.getDate() === end.getDate();

    while (cursor <= end) {
      const dayStr = cursor.toDateString();
      if (isWeekday(cursor) && !holidays.includes(dayStr)) {
        totalNeededHours += 8;
        const dayEvents = eventsByDay[dayStr] || [];

        // Calculate total approved and pending durations for the day (time charges)
        let approvedDuration = 0;
        let pendingDuration = 0;
        dayEvents.forEach((e) => {
          const dur = calculateDuration(e.start, e.end);
          if (e.status === "approved") approvedDuration += dur;
          if (e.status === "pending") pendingDuration += dur;
        });

        // Add leave durations for the day
        const leaveDur = leaveDurationsByDay[dayStr] || { approved: 0, pending: 0 };
        // console.log("Leave durations for", dayStr, ":", leaveDur);
        approvedDuration += leaveDur.approved;
        pendingDuration += leaveDur.pending;

        // Cap total charged hours per day to 8
        const totalApprovedAndPending = Math.min(approvedDuration + pendingDuration, 8);
        const cappedPending = Math.min(pendingDuration, Math.max(8 - approvedDuration, 0));

        // --- FIX: For day view, missing hours is always 8 minus total approved and pending, never negative ---
        if (isSingleDay) {
          const missing = Math.max(0, 8 - (approvedDuration + pendingDuration));
          missingHours += missing;
          pendingHours += cappedPending;
        } else {
          // For week/month, keep original logic
          if (totalApprovedAndPending < 8) {
            missingHours += 8 - totalApprovedAndPending;
          }
          pendingHours += cappedPending;
        }
      }
      if (isSingleDay) break;
      cursor.setDate(cursor.getDate() + 1);
    }

    return { missingHours, pendingHours, upToDate: false };
  };

  // --- FLEXIBLE STATS SECTION ---
  const range = getViewRange(date, view);
  const showStats = shouldShowStats(range);

  let statsContent = null;
  if (showStats) {
    const stats = computeStats({ events, userHireDate, range });

    // Helper to format week and day labels
    const formatStatsPeriod = () => {
      if (view === "month") {
        return `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`;
      }
      if (view === "week") {
        const start = range.start;
        const end = range.end;
        const startStr = `${start.toLocaleString("default", { month: "short" })} ${start.getDate()}`;
        const endStr = `${end.toLocaleString("default", { month: "short" })} ${end.getDate()}`;
        return `${startStr} - ${endStr}`;
      }
      // day
      return `${date.toLocaleString("default", { month: "short" })} ${date.getDate()}`;
    };
    
    if (!isMobile) {
      if (stats.upToDate) {
      statsContent = (
        <div className="flex flex-col md:flex-row gap-2 w-full max-w-xl justify-center items-center">
        <div className={`border-l-4 px-4 py-1 text-xs font-medium bg-green-50 text-green-800 border-green-400 justify-center text-center items-center`}>
          Up to date
        </div>
        </div>
      );
      } else {
      const missingBg =
        stats.missingHours === 0
        ? "bg-green-50 text-green-800 border-green-400"
        : "bg-red-50 text-red-800 border-red-400";
      const pendingBg =
        stats.pendingHours === 0
        ? "bg-green-50 text-green-800 border-green-400"
        : "bg-yellow-50 text-yellow-800 border-yellow-400";
      statsContent = (
        <div className="flex flex-col md:flex-row gap-2 w-full max-w-xl justify-center items-center">
        <div className={`border-l-4 px-4 py-1 text-xs font-medium ${missingBg}`}>
          {stats.missingHours === 0 ? (
          <>
            <span className="font-semibold">No missing hours</span>
            <br />
            {/* <span className="text-xxs">{formatStatsPeriod()}</span> */}
          </>
          ) : (
          <>
            <span className="font-semibold">Missing:</span>{" "}
            <span className="font-bold">
            {Math.floor(stats.missingHours)}
            <span className="text-xxs align-bottom" style={{ fontSize: "0.65rem", verticalAlign: "bottom" }}>
              {stats.missingHours % 1 !== 0 ? `.${(stats.missingHours % 1).toFixed(2).split(".")[1]}h` : "h"}
            </span>
            </span>
            <br />
            {/* <span className="text-xxs">{formatStatsPeriod()}</span> */}
          </>
          )}
        </div>
        <div className={`border-l-4 px-4 py-1 text-xs font-medium ${pendingBg}`}>
          {stats.pendingHours === 0 ? (
          <>
            <span className="font-semibold">No pending</span>
            <br />
            {/* <span className="text-xxs">{formatStatsPeriod()}</span> */}
          </>
          ) : (
          <>
            <span className="font-semibold">For Approval:</span>{" "}
            <span className="font-bold">
            {Math.floor(stats.pendingHours)}
            <span className="text-xxs align-bottom" style={{ fontSize: "0.65rem", verticalAlign: "bottom" }}>
              {stats.pendingHours % 1 !== 0 ? `.${(stats.pendingHours % 1).toFixed(2).split(".")[1]}h` : "h"}
            </span>
            </span>
            <br />
            {/* <span className="text-xxs">{formatStatsPeriod()}</span> */}
          </>
          )}
        </div>
        </div>
      );
      }
    } else {
      statsContent = null;
    }
  }

  return (
    <div className="top-0 sticky z-20 flex flex-col md:flex-row items-start md:items-center justify-between py-3 px-4 md:px-6 bg-white border-b gap-2 md:gap-0">
      <div className="flex items-center gap-2 w-full md:w-auto justify-center text-center">
        <button
          className="flex items-center text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 shadow-sm cursor-pointer min-h-[40px] px-5 w-full md:w-auto justify-center text-center"
          onClick={() => onNavigate('TODAY')}
        >
          Today
        </button>
        <button
          className="flex items-center text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 shadow-sm cursor-pointer min-h-[40px] px-3 w-full md:w-auto justify-center text-center"
          onClick={() => onNavigate('PREV')}
        >
          <span className="flex items-center justify-center text-gray-500">
            <ChevronLeft size={18} />
          </span>
        </button>
        <button
          className="flex items-center text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 shadow-sm cursor-pointer min-h-[40px] px-3 w-full md:w-auto justify-center text-center"
          onClick={() => onNavigate('NEXT')}
        >
          <span className="flex items-center justify-center text-gray-500">
            <ChevronRight size={18} />
          </span>
        </button>
        <span className="font-semibold text-gray-700 text-lg w-full text-center flex justify-center items-center">
          {
            /\d{4}/.test(label)
              ? label
              : `${label}, ${date.getFullYear()}`
          }
        </span>
      </div>

      {/* Flexible Stats */}
      {statsContent}

      <div className="w-full md:w-auto mt-2 md:mt-0 flex items-center gap-2">
        {views.map((v) => {
          const isActive = view === v;
          return (
            <button
              key={v}
              className={`flex justify-center text-center items-center rounded-full transition-all duration-300 shadow-sm cursor-pointer min-h-[40px] px-5 w-full md:w-auto ${isActive
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-gray-200'
                }`}
              onClick={() => onView(v)}
            >
              {localizer?.messages?.[v] || v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          );
        })}

        {/* <div
          className="group relative flex items-center bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 shadow-sm cursor-pointer min-h-[40px] px-3"
          onClick={() => setShowSidebarOptions(showSidebarOptions === 'filter' ? null : 'filter')}
          tabIndex={0}
          style={{ minHeight: 40 }}
        >
          <span className="flex items-center justify-center text-gray-500">
            <Filter size={18} />
          </span>
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-20">
            Filter
          </div>
        </div> */}
      </div>
      {children && <div className="ml-0 md:ml-4 mt-2 md:mt-0 w-full md:w-auto">{children}</div>}
    </div>
  );
};



export default CustomToolbar;