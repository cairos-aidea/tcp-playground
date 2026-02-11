import React, { useState, useEffect } from "react";
import { useAppData } from "../../../context/AppDataContext";
import { api } from "../../../api/api";
import * as XLSX from "xlsx";

const Export = () => {
  // Get subsidiaries and departments from context
  const { headerReq, staffs, subsidiaries, departments } = useAppData();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState(staffs.map((s) => s.id));

  // Search states
  const [subsidiarySearch, setSubsidiarySearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");


  // Add department and subsidiary filters
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState(departments.map((d) => d.id));
  const [selectedSubsidiaryIds, setSelectedSubsidiaryIds] = useState(subsidiaries.map((s) => s.id));

  // Filter staffs by selected subsidiaries, departments, and search
  const filteredStaffs = staffs.filter(
    (s) =>
      (selectedSubsidiaryIds.length === 0 || selectedSubsidiaryIds.includes(s.subsidiary_id)) &&
      (selectedDepartmentIds.length === 0 || selectedDepartmentIds.includes(s.department)) &&
      s.name.toLowerCase().includes(staffSearch.toLowerCase())
  );

  // Handle user_ids checklist
  const allChecked = selectedUserIds.length === filteredStaffs.length && filteredStaffs.length > 0;
  const isIndeterminate = selectedUserIds.length > 0 && !allChecked;

  const handleUserCheck = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id)
        ? prev.filter((uid) => uid !== id)
        : [...prev, id]
    );
  };

  const handleAllUserCheck = () => {
    setSelectedUserIds(allChecked ? [] : filteredStaffs.map((s) => s.id));
  };


  // Filter subsidiaries by search
  const filteredSubsidiaries = subsidiaries.filter((s) =>
    s.name.toLowerCase().includes(subsidiarySearch.toLowerCase())
  );

  // Filter departments under selected subsidiaries and by search
  const filteredDepartments = departments.filter(
    (d) =>
      (selectedSubsidiaryIds.length === 0 || selectedSubsidiaryIds.includes(d.subsidiary_id)) &&
      d.name.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  // Update selectedUserIds when filters change
  useEffect(() => {
    setSelectedUserIds(filteredStaffs.map((s) => s.id));
  }, [selectedSubsidiaryIds, selectedDepartmentIds, staffs, staffSearch]);

  // Handle subsidiary and department selection
  const handleSubsidiaryCheck = (id) => {
    setSelectedSubsidiaryIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
    setSelectedDepartmentIds([]); // Reset departments when subsidiaries change
  };

  const handleAllSubsidiaryCheck = () => {
    if (selectedSubsidiaryIds.length === filteredSubsidiaries.length && filteredSubsidiaries.length > 0) {
      setSelectedSubsidiaryIds([]);
      setSelectedDepartmentIds([]);
    } else {
      setSelectedSubsidiaryIds(filteredSubsidiaries.map((s) => s.id));
      setSelectedDepartmentIds([]);
    }
  };

  const handleDepartmentCheck = (id) => {
    setSelectedDepartmentIds((prev) =>
      prev.includes(id) ? prev.filter((did) => did !== id) : [...prev, id]
    );
  };

  const handleAllDepartmentCheck = () => {
    if (selectedDepartmentIds.length === filteredDepartments.length && filteredDepartments.length > 0) {
      setSelectedDepartmentIds([]);
    } else {
      setSelectedDepartmentIds(filteredDepartments.map((d) => d.id));
    }
  };

  // Update getFilters to include department and subsidiary
  const getFilters = () => ({
    start_date: startDate,
    end_date: endDate,
    subsidiary_ids: selectedSubsidiaryIds,
    department_ids: selectedDepartmentIds,
    user_ids: selectedUserIds,
  });

  const handleExport = async () => {
    setLoading(true);
    try {
      const filters = getFilters();
      const data = await api(
        "export_data",
        headerReq,
        filters,
        "POST"
      );
      if (data && data.status === "success" && Array.isArray(data.data)) {
        const ws = XLSX.utils.json_to_sheet(data.data);

        // Auto-fit column widths based on data
        const objectMaxLength = [];
        data.data.forEach(row => {
          Object.entries(row).forEach(([key, value], colIdx) => {
            const cellValue = value == null ? "" : String(value);
            objectMaxLength[colIdx] = Math.max(
              objectMaxLength[colIdx] || key.length,
              cellValue.length
            );
          });
        });

        // Freeze the first 3 columns in the exported sheet
        ws['!freeze'] = { xSplit: 3, ySplit: 1 }; // 3 columns, 1 row (header)
        // Also consider header length
        const headers = Object.keys(data.data[0] || {});
        headers.forEach((header, colIdx) => {
          objectMaxLength[colIdx] = Math.max(objectMaxLength[colIdx] || 0, header.length);
        });
        ws['!cols'] = objectMaxLength.map(w => ({ wch: w + 2 }));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Export");
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, "0");
        const datetimeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        const filename = `${datetimeStr}-Exported-Time-Charge-Data.xlsx`;
        XLSX.writeFile(wb, filename);
      } else {
        alert("No data to export.");
      }
    } catch (err) {
      alert("Export failed.");
    } finally {
      setLoading(false);
    }
  };

  // Set default date range to current month
  useEffect(() => {
    const now = new Date();
    // Singapore offset in ms
    const sgOffset = 8 * 60 * 60 * 1000;
    // Get Singapore time
    const sgNow = new Date(now.getTime() + sgOffset);

    const year = sgNow.getUTCFullYear();
    const month = sgNow.getUTCMonth();

    const firstDay = new Date(Date.UTC(year, month, 1) + sgOffset);
    const lastDay = new Date(Date.UTC(year, month + 1, 0) + sgOffset);

    setStartDate(firstDay.toISOString().slice(0, 10));
    setEndDate(lastDay.toISOString().slice(0, 10));
  }, []);

  // All checked logic for subsidiaries and departments
  const allSubsidiariesChecked = selectedSubsidiaryIds.length === filteredSubsidiaries.length && filteredSubsidiaries.length > 0;
  const isSubsidiaryIndeterminate = selectedSubsidiaryIds.length > 0 && !allSubsidiariesChecked;

  const allDepartmentsChecked = selectedDepartmentIds.length === filteredDepartments.length && filteredDepartments.length > 0;
  const isDepartmentIndeterminate = selectedDepartmentIds.length > 0 && !allDepartmentsChecked;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 flex flex-col h-[90vh]">
      <div className="mb-4">
        <p className="text-sm text-gray-700">
          This will export time charges and hours data based on the filters selected below.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Start Date */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">Start Date</label>
            <input
              type="date"
              className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          {/* End Date */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">End Date</label>
            <input
              type="date"
              className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {/* Subsidiary selection */}
          <div className="flex flex-col">
            <label className="block mb-2 text-sm font-medium text-gray-900">Subsidiary</label>
            <input
              type="text"
              placeholder="Search subsidiaries..."
              value={subsidiarySearch}
              onChange={(e) => setSubsidiarySearch(e.target.value)}
              className="mb-2 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />
            <div className="border rounded-lg bg-gray-50 max-h-40 overflow-y-auto space-y-1 p-2">
              <div className="flex items-center mb-2">
                <input
                  id="all-subsidiaries"
                  type="checkbox"
                  checked={allSubsidiariesChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = isSubsidiaryIndeterminate;
                  }}
                  onChange={handleAllSubsidiaryCheck}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="all-subsidiaries" className="ml-2 text-sm font-medium text-gray-900">
                  All
                </label>
              </div>
              {filteredSubsidiaries.map((subsidiary) => (
                <div key={subsidiary.id} className="flex items-center">
                  <input
                    id={`subsidiary-${subsidiary.id}`}
                    type="checkbox"
                    checked={selectedSubsidiaryIds.includes(subsidiary.id)}
                    onChange={() => handleSubsidiaryCheck(subsidiary.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`subsidiary-${subsidiary.id}`} className="ml-2 text-sm text-gray-900">
                    {subsidiary.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          {/* Department selection */}
          <div className="flex flex-col">
            <label className="block mb-2 text-sm font-medium text-gray-900">Department</label>
            <input
              type="text"
              placeholder="Search departments..."
              value={departmentSearch}
              onChange={(e) => setDepartmentSearch(e.target.value)}
              className="mb-2 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />
            <div className="border rounded-lg bg-gray-50 max-h-40 overflow-y-auto space-y-1 p-2">
              <div className="flex items-center mb-2">
                <input
                  id="all-departments"
                  type="checkbox"
                  checked={allDepartmentsChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = isDepartmentIndeterminate;
                  }}
                  onChange={handleAllDepartmentCheck}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="all-departments" className="ml-2 text-sm font-medium text-gray-900">
                  All
                </label>
              </div>
              {filteredDepartments.map((department) => (
                <div key={department.id} className="flex items-center">
                  <input
                    id={`department-${department.id}`}
                    type="checkbox"
                    checked={selectedDepartmentIds.includes(department.id)}
                    onChange={() => handleDepartmentCheck(department.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`department-${department.id}`} className="ml-2 text-sm text-gray-900">
                    {department.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Staff selection */}
        <div className="mt-6">
          <label className="block mb-2 text-sm font-medium text-gray-900">Staff</label>
          <input
            type="text"
            placeholder="Search staff..."
            value={staffSearch}
            onChange={(e) => setStaffSearch(e.target.value)}
            className="mb-2 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          />
          <div className="border rounded-lg bg-gray-50 max-h-52 overflow-y-auto p-2">
            <div className="flex items-center mb-2">
              <input
                id="all-staff"
                type="checkbox"
                checked={allChecked}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={handleAllUserCheck}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="all-staff" className="ml-2 text-sm font-medium text-gray-900">
                All
              </label>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredStaffs.map((staff) => (
                <div key={staff.id} className="flex items-center">
                  <input
                    id={`staff-${staff.id}`}
                    type="checkbox"
                    checked={selectedUserIds.includes(staff.id)}
                    onChange={() => handleUserCheck(staff.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`staff-${staff.id}`} className="ml-2 text-sm text-gray-900">
                    {staff.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Export Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleExport}
          disabled={loading}
          className="min-w-[180px] text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        >
          {loading ? "Exporting..." : "Export to XLSX"}
        </button>
      </div>
    </div>
  );
};

export default Export;