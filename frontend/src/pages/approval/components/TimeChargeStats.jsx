import { api } from '../../../api/api';
import React, { useMemo, useState, useEffect } from 'react';
import { SquareChartGantt, SendHorizontal } from 'lucide-react';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TimeChargeStats = ({
  authUser,
  departments,
  staffs,
  holidays,
  headerReq
}) => {
  const signedInUserId = authUser.id;
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const usersUnderSignedInUser = useMemo(() => {
    const managedDepartmentIds = departments
      .filter(dep => dep.department_head_id === signedInUserId)
      .map(dep => dep.id);
    return staffs.filter(staff => managedDepartmentIds.includes(staff.department));
  }, [departments, staffs, signedInUserId]);

  const getFixedHolidayDates = (year, fixedHolidays) => {
    // fixedHolidays[].date is "MM-DD", need to convert to "YYYY-MM-DD"
    return fixedHolidays.map(h => {
      // Pad month and day to 2 digits
      const [mm, dd] = String(h.date).split('-');
      // Ensure mm and dd are numbers and valid
      const month = String(Number(mm)).padStart(2, '0');
      const day = String(Number(dd)).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
  };

  const getDynamicHolidayDates = (dynamicHolidays) => {
    // dynamicHolidays[].date is "YYYY-MM-DD" as varchar, ensure it's valid
    return dynamicHolidays.map(h => {
      // Try to parse and reformat to "YYYY-MM-DD"
      const d = new Date(h.date);
      if (!isNaN(d)) {
        return d.toISOString().slice(0, 10);
      }
      // fallback to original string if parsing fails
      return String(h.date).slice(0, 10);
    });
  };

  const getWeekdaysInMonth = (year, month, holidaysStr, untilDay = null) => {
    // holidaysStr can be an object or a string, handle both
    let holidaysObj = holidaysStr;
    if (typeof holidaysStr === 'string') {
      try {
        holidaysObj = JSON.parse(holidaysStr);
      } catch {
        holidaysObj = { fixedHolidays: [], dynamicHolidays: [] };
      }
    }
    const holidaySet = new Set([
      ...getFixedHolidayDates(year, holidaysObj.fixedHolidays || []),
      ...getDynamicHolidayDates(holidaysObj.dynamicHolidays || [])
    ]);
    let weekdays = [];
    let date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (untilDay && date.getDate() > untilDay) break;
      const day = date.getDay();
      const dateStr = date.toISOString().slice(0, 10);
      if (day !== 0 && day !== 6 && !holidaySet.has(dateStr)) {
        weekdays.push(dateStr);
      }
      date.setDate(date.getDate() + 1);
    }
    return weekdays;
  };

  const handleCheck = async () => {
    setLoading(true);
    setStats(null);

    const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    let endDate;
    let endDateStr;
    let untilDay = null;

    if (
      selectedYear === today.getFullYear() &&
      selectedMonth === today.getMonth()
    ) {
      endDate = today;
      endDateStr = today.toISOString().slice(0, 10);
      untilDay = today.getDate();
    } else {
      endDate = new Date(selectedYear, selectedMonth + 1, 0);
      endDateStr = endDate.toISOString().slice(0, 10);
    }

    const isPastOrCurrentMonth =
      selectedYear < today.getFullYear() ||
      (selectedYear === today.getFullYear() && selectedMonth <= today.getMonth());

    if (!isPastOrCurrentMonth) {
      setStats({ message: 'Cannot check for future months.' });
      setLoading(false);
      return;
    }

    try {
      const userIds = usersUnderSignedInUser.map(u => u.id);

      if (userIds.length === 0) {
        setStats({ message: 'No users under your supervision.' });
        setLoading(false);
        return;
      }

      const headerParams = {
        ...headerReq,
        year: selectedYear,
        start_date: startDate,
        end_date: endDateStr,
        user_ids: userIds
      };
      const data = await api("time_charges", headerParams, null);

      const statsResult = {};
      userIds.forEach(uid => {
        const userCharges = data.filter(tc => tc.user_id === uid && tc.isOverTime === 0);
        const dailyTotals = {};
        userCharges.forEach(tc => {
          const date = tc.date;
          const hrs = Number(tc.duration_hrs) || 0;
          const mns = Number(tc.duration_mns) || 0;
          const total = +(hrs + mns / 60).toFixed(2);
          if (!dailyTotals[date]) dailyTotals[date] = 0;
          dailyTotals[date] += total;
        });

        const weekdays = getWeekdaysInMonth(selectedYear, selectedMonth, holidays, untilDay);
        const requiredHours = weekdays.length * 8;
        const totalRequiredHours = Math.max(0, requiredHours);

        const totalRegularHours = Object.values(dailyTotals).reduce((sum, v) => +(sum + v).toFixed(2), 0);

        statsResult[uid] = {
          totalRegularHours,
          requiredHours: totalRequiredHours,
          missingHours: Math.max(0, +(totalRequiredHours - totalRegularHours).toFixed(2))
        };
      });

      setStats(statsResult); // Pass the computed stats here
    } catch (e) {
      setStats({ message: 'Failed to fetch time charges.' });
    }
    setLoading(false);
  };


  // Run check automatically on mount for current month/year
  useEffect(() => {
    handleCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white z-50 p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center space-x-2">
          <SquareChartGantt size={18} />
          <span>Time Charge Stats</span>
        </h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Date</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label htmlFor="month" className="text-sm">Month</label>
              <select
                className="w-full p-2 border rounded-lg text-sm focus:ring-primary cursor-pointer"
                id="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="year" className="text-sm">Year</label>
              <select
                className="w-full p-2 border rounded-lg text-sm focus:ring-primary cursor-pointer"
                id="year"
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
              >
                {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          className="flex-[2] text-sm px-6 py-3 bg-primary text-white rounded-full hover:bg-primary-hover focus:ring-primary"
          onClick={handleCheck}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
      </div>

      {stats && (
        <div className="mt-4">
          {stats.message ? (
            <p>{stats.message}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {usersUnderSignedInUser.map(user => {
                const s = stats[user.id] || {};
                const { totalRegularHours: t = 0, requiredHours: r = 0, missingHours: m = 0 } = s;
                const p = r > 0 ? Math.min(t / r, 1) : 0;
                let bar = "bg-yellow-400";
                if (p >= 1) bar = "bg-green-500";
                else if (r === 0) bar = "bg-gray-400";

                const initials = user.name
                  ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : '';

                return (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-lg shadow p-3 gap-2 w-full"
                  >
                    <div className="flex items-center w-full">
                      {user.profile ? (
                        <img
                          className="w-8 h-8 rounded-full"
                          src={`data:image/png;base64,${user.profile}`}
                          alt="User"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-950 text-sm">{initials}</span>
                        </div>
                      )}
                      <div className="ps-3 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
                        <div className="flex-1">
                          <div className="font-semibold text-xs">{user.name}</div>
                          {r === 0 ? (
                            <div className="bg-gray-400 text-xs font-medium text-center text-primary font-mono leading-none rounded-full h-4 flex items-center justify-center transition-all w-full" title="N/A">
                              N/A
                            </div>
                          ) : (
                            <div className={`relative w-full h-5 rounded-full border overflow-hidden mt-1 ${p >= 1 ? "bg-green-500" : "bg-yellow-400"}`}>
                              <div
                                className={`absolute left-0 top-0 h-full transition-all duration-300 ${p >= 1 ? "bg-green-500" : "bg-yellow-400"}`}
                                style={{
                                  width: `${Math.min(p * 100, 100)}%`,
                                  borderRadius: p >= 1 ? '9999px' : '9999px 0 0 9999px'
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-semibold text-gray-950">
                                {p >= 1
                                  ? 'Done'
                                  : `${t}h / ${r}h`}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeChargeStats;
