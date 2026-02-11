import React, { useEffect, useState, useRef, useMemo } from "react";
import moment from "moment";
import { useAppData } from "../context/AppDataContext";

const Dashboard = () => {
  const { auth_accessToken, auth_user, departments } = useAppData();

  const [month, setMonth] = useState(new Date().toLocaleString("en-US", { month: "2-digit" }));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [timeCharges, setTimeCharges] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce ref
  const fetchTimeout = useRef();

  useEffect(() => {
    document.title = "Dashboard | Aidea Time Charging";
  }, []);

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    if (!timeCharges || timeCharges.length === 0) {
      return {
        totalHours: 0,
        totalApproved: 0,
        totalPending: 0,
        totalOvertime: 0,
        totalEntries: 0,
        totalBillable: 0,
        totalNonBillable: 0,
        projectBreakdown: {},
      };
    }
    let totalHours = 0;
    let totalApproved = 0;
    let totalPending = 0;
    let totalOvertime = 0;
    let totalBillable = 0;
    let totalNonBillable = 0;
    let projectBreakdown = {};

    timeCharges.forEach(tc => {
      const hours = Number(tc.duration_hrs || 0) + Number(tc.duration_mns || 0) / 60;
      totalHours += hours;
      if (tc.status === "approved") totalApproved += hours;
      if (tc.status === "pending") totalPending += hours;
      if (tc.isOverTime) totalOvertime += hours;
      if (tc.billable) totalBillable += hours;
      if (tc.non_billable) totalNonBillable += hours;

      // Project breakdown
      const key = tc.project_code || tc.activity || "Other";
      if (!projectBreakdown[key]) {
        projectBreakdown[key] = { label: tc.project_label || tc.activity || "Other", hours: 0 };
      }
      projectBreakdown[key].hours += hours;
    });

    return {
      totalHours,
      totalApproved,
      totalPending,
      totalOvertime,
      totalEntries: timeCharges.length,
      totalBillable,
      totalNonBillable,
      projectBreakdown,
    };
  }, [timeCharges]);
  // --- End Stats Calculation ---

  return (
    <div className="container-fluid h-[calc(100vh-4rem)]">
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left section */}
      <div className="lg:col-span-3 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Hello, {auth_user.first_name}</h1>
          <p className="text-sm text-gray-500">Track your time charges here!</p>
        </div>

        {/* <div className="flex items-center gap-4 mb-6">
          <label className="font-medium">Month:</label>
          <select
            className="border rounded px-2 py-1"
            value={month || new Date().toLocaleString("en-US", { month: "2-digit" })}
            onChange={(e) => setMonth(e.target.value)}
          >
            {Array.from({ length: 12 }, (_, i) => {
              const m = String(i + 1).padStart(2, "0");
              return (
                <option key={m} value={m}>
                  {new Date(0, i).toLocaleString("en-US", { month: "long" })}
                </option>
              );
            })}
          </select>
          <label className="font-medium">Year:</label>
          <select
            className="border rounded px-2 py-1"
            value={year || String(new Date().getFullYear())}
            onChange={(e) => setYear(e.target.value)}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const y = String(new Date().getFullYear() - i);
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div> */}

        {/* --- Stats Section --- */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4 flex flex-col items-center">
            <div className="text-xs text-gray-500">Total Entries</div>
            <div className="text-xl font-bold">{stats.totalEntries}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 flex flex-col items-center">
            <div className="text-xs text-gray-500">Total Hours</div>
            <div className="text-xl font-bold">{stats.totalHours.toFixed(2)}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 flex flex-col items-center">
            <div className="text-xs text-gray-500">Approved Hours</div>
            <div className="text-xl font-bold text-green-600">{stats.totalApproved.toFixed(2)}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 flex flex-col items-center">
            <div className="text-xs text-gray-500">Pending Hours</div>
            <div className="text-xl font-bold text-yellow-600">{stats.totalPending.toFixed(2)}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 flex flex-col items-center">
            <div className="text-xs text-gray-500">Overtime Hours</div>
            <div className="text-xl font-bold text-blue-600">{stats.totalOvertime.toFixed(2)}</div>
          </div>
        </div> */}

        {/* Project Breakdown */}
        {/* <div className="bg-white shadow rounded-lg mt-4">
          <div className="px-4 py-2 font-semibold text-gray-700 border-b">Project Breakdown</div>
          <div className="px-4 py-2">
            {Object.keys(stats.projectBreakdown).length === 0 ? (
              <div className="text-gray-400 italic">No data</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-2 py-1">Project/Activity</th>
                    <th className="text-right px-2 py-1">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.projectBreakdown).map(([key, val]) => (
                    <tr key={key}>
                      <td className="px-2 py-1">{val.label}</td>
                      <td className="px-2 py-1 text-right">{val.hours.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div> */}
        {/* 
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white shadow rounded-lg p-4 flex items-center gap-4">
          <CheckCircle className="text-green-500" size={24} />
          <div>
            <p className="text-sm font-medium">Finished</p>
            <p className="text-lg font-bold">18 <span className="text-green-500 text-sm">+8 tasks</span></p>
          </div>
            </div>
            <div className="bg-white shadow rounded-lg p-4 flex items-center gap-4">
          <Clock className="text-red-500" size={24} />
          <div>
            <p className="text-sm font-medium">Tracked</p>
            <p className="text-lg font-bold">31h <span className="text-red-500 text-sm">-6 hours</span></p>
          </div>
            </div>
            <div className="bg-white shadow rounded-lg p-4 flex items-center gap-4">
          <LineIcon className="text-blue-500" size={24} />
          <div>
            <p className="text-sm font-medium">Efficiency</p>
            <p className="text-lg font-bold">93% <span className="text-green-500 text-sm">+12%</span></p>
          </div>
            </div>
          </div> 
          
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-2 font-semibold text-gray-700 border-b">Current Tasks <span className="text-sm text-gray-400 ml-2">Done 30%</span></div>
            <div className="px-4 py-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-blue-200"></span>
              <p>Product Review for UI8 Market</p>
            </div>
            <p className="text-sm text-gray-500">In progress · 4h</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <p>UX Research for Product</p>
            </div>
            <p className="text-sm text-gray-500">On hold · 8h</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
              <p>App design and development</p>
            </div>
            <p className="text-sm text-gray-500">Done · 32h</p>
          </div>
            </div>
          </div>  
          */}
      </div>
    </div>
    </div>
  );
};

export default Dashboard;