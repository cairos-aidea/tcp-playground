import React from "react";
import Select from "react-select";
import { Clock } from "lucide-react";
import { isHoliday } from "../../../utilities/utils";


const TimeEntryFields = ({
  tab,
  form,
  setForm,
  setActivityOptions,
  handleFormChange,
  isReadOnly,
  isWeekend,
  externalProjects,
  internalProjects,
  departmentalActivities,
  externalProjectStages,
  obReasons,
  ACTIVITIES,
}) => {
  if (tab === "time_charge") {
    // Determine if the current date is a holiday
    const isHolidayChecked = isWeekend || (form.date && isHoliday(form.date, form.holidays));

    // Determine OT checked state
    const isOTChecked =
      isHolidayChecked ||
      !!(
        form.isOT ||
        form.isOverTime === 1 ||
        form.isOT === 1
      );

    return (
      <>
        {/* Project Type Tabs */}
        <div className="mb-2 flex gap-2">
          {["external", "internal", "departmental"].map((type) => (
            <button
              key={type}
              type="button"
              className={`px-3 py-1 rounded-t ${form.projectType === type ? "bg-blue-100 font-semibold" : "bg-gray-100"}`}
              onClick={() => {
                setForm((f) => ({
                  ...f,
                  projectType: type,
                  activity: "",
                  projectName: "",
                  projectStage: "",
                }));
                setActivityOptions(ACTIVITIES[type] || []);
              }}
              disabled={isReadOnly}
            >
              {type === "external"
                ? "Project External"
                : type === "internal"
                  ? "Project Internal"
                  : "Departmental Project"}
            </button>
          ))}
        </div>
        {/* Project Name/Activity Dropdowns */}
        {form.projectType === "external" && (
          <div className="mb-2">
            <Select
              name="projectName"
              value={externalProjects.find(p => p.value === Number(form.projectName)) || null}
              onChange={(selectedOption) =>
                handleFormChange({
                  target: {
                    name: "projectName",
                    value: selectedOption?.value || "",
                  },
                })
              }
              options={externalProjects}
              isDisabled={isReadOnly}
              placeholder="Select Project Name"
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
        )}

        {form.projectType === "internal" && (
          <div className="mb-2">
            <Select
              name="projectName"
              value={internalProjects.find(p => p.value === Number(form.projectName)) || null}
              onChange={(selectedOption) =>
                handleFormChange({
                  target: {
                    name: "projectName",
                    value: selectedOption?.value || "",
                  },
                })
              }
              options={internalProjects}
              isDisabled={isReadOnly}
              placeholder="Select Project Name"
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
        )}

        {form.projectType === "departmental" && (
          <div className="mb-2">
            <Select
              name="activity"
              value={departmentalActivities.find(a => a.label === form.activity) || null}
              onChange={(selectedOption) =>
                handleFormChange({
                  target: {
                    name: "activity",
                    value: selectedOption?.label || "",
                  },
                })
              }
              options={departmentalActivities}
              isDisabled={isReadOnly}
              placeholder="Select Activity"
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
        )}
        {form.projectType === "external" && (
          <div className="mb-2">
            <Select
              name="projectStage"
              value={externalProjectStages.find(s => s.value === Number(form.projectStage)) || null}
              onChange={(selectedOption) =>
                handleFormChange({
                  target: {
                    name: "projectStage",
                    value: selectedOption?.value || "",
                  },
                })
              }
              options={externalProjectStages}
              isDisabled={isReadOnly}
              placeholder="Select Project Stage"
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
        )}
        {/* Activity (external only) */}
        {form.projectType === "external" && (
          <div className="mb-2">
            <Select
              name="activity"
              value={(ACTIVITIES["external"] || []).map(act => ({ value: act, label: act })).find(a => a.value === form.activity) || null}
              onChange={(selectedOption) =>
                handleFormChange({
                  target: {
                    name: "activity",
                    value: selectedOption?.value || "",
                  },
                })
              }
              options={(ACTIVITIES["external"] || []).map(act => ({ value: act, label: act }))}
              isDisabled={isReadOnly}
              placeholder="Select Activity"
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
        )}
        {/* Start/End */}
        <div className="mb-2 flex gap-2">
          <div className="flex-1 relative">
            <input
              type="datetime-local"
              name="start"
              value={form.start}
              onChange={handleFormChange}
              required
              className="block w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500 pl-10"
              disabled={isReadOnly}
            />
            <span className="absolute left-2 top-2.5 text-gray-400 pointer-events-none">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="flex-1 relative">
            <input
              type="datetime-local"
              name="end"
              value={form.end}
              onChange={handleFormChange}
              required
              className="block w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500 pl-10"
              disabled={isReadOnly}
            />
            <span className="absolute left-2 top-2.5 text-gray-400 pointer-events-none">
              <Clock className="w-4 h-4" />
            </span>
          </div>
        </div>
        {/* OT/Next Day */}
        <div className="mb-2 flex items-center gap-4">
          <input
            type="checkbox"
            id="isOT"
            name="isOT"
            checked={
              !!form.isOT ||
              form.isOverTime === 1 ||
              form.isOT === 1 ||
              form.data?.isOverTime === 1 ||
              form.data?.is_ot === true
            }
            onChange={handleFormChange}
            className="h-4 w-4"
            disabled={isReadOnly}
          />
          <label htmlFor="isOT" className="text-sm">
            Overtime
            {(isWeekend || (form.date && isHoliday(form.date, form.holidays))) && " (Weekend/Holiday - required)"}
          </label>
          {(!!form.isOT ||
            form.isOverTime === 1 ||
            form.isOT === 1 ||
            form.data?.isOverTime === 1) && (
              <>
                <input
                  type="checkbox"
                  id="nextDayOT"
                  name="nextDayOT"
                  checked={!!form.nextDayOT}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded ml-4"
                  disabled={isReadOnly}
                />
                <label htmlFor="nextDayOT" className="ml-1 select-none">
                  Next Day OT
                </label>
              </>
            )}
        </div>
      </>
    );
  }
  if (tab === "leaves") {
    return (
      <>
        <div className="mb-2">
          <select
            name="leaveType"
            value={form.leaveType || ""}
            onChange={handleFormChange}
            required
            className="block w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            disabled={isReadOnly}
          >
            <option value="">Select Leave Type</option>
            {(ACTIVITIES["leave"] || []).map((lt) => (
              <option key={lt} value={lt}>
                {lt}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2 flex gap-2">
          <div className="flex-1 relative">
            <input
              type="datetime-local"
              name="start"
              value={form.start}
              onChange={handleFormChange}
              required
              className="block w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500 pl-10"
              disabled={isReadOnly}
            />
            <span className="absolute left-2 top-2.5 text-gray-400 pointer-events-none">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="flex-1 relative">
            <input
              type="datetime-local"
              name="end"
              value={form.end}
              onChange={handleFormChange}
              required
              className="block w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500 pl-10"
              disabled={isReadOnly}
            />
            <span className="absolute left-2 top-2.5 text-gray-400 pointer-events-none">
              <Clock className="w-4 h-4" />
            </span>
          </div>
        </div>
        <div className="mb-2">
          <input
            type="text"
            name="reason"
            value={form.reason || ""}
            onChange={handleFormChange}
            required
            placeholder="Reason"
            className="block w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            disabled={isReadOnly}
          />
        </div>
      </>
    );
  }
  if (tab === "official_business") {
    return (
      <>
        <div className="mb-2 flex gap-2">
          <div className="flex-1 relative">
            <input
              type="datetime-local"
              name="start"
              value={form.start}
              onChange={handleFormChange}
              required
              className="block w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500 pl-10"
              disabled={isReadOnly}
            />
            <span className="absolute left-2 top-2.5 text-gray-400 pointer-events-none">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="flex-1 relative">
            <input
              type="datetime-local"
              name="end"
              value={form.end}
              onChange={handleFormChange}
              required
              className="block w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500 pl-10"
              disabled={isReadOnly}
            />
            <span className="absolute left-2 top-2.5 text-gray-400 pointer-events-none">
              <Clock className="w-4 h-4" />
            </span>
          </div>
        </div>
        <div className="mb-2">
          <input
            type="text"
            name="reason"
            value={form.reason || ""}
            onChange={handleFormChange}
            required
            placeholder="Reason"
            className="block w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            list="ob-reason-list"
            disabled={isReadOnly}
          />
          <datalist id="ob-reason-list">
            {obReasons.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
          <div className="flex gap-2 mt-1">
            {obReasons.map((r) => (
              <button
                key={r}
                type="button"
                className="bg-gray-100 px-2 py-1 rounded text-xs hover:bg-blue-100"
                onClick={() => setForm((f) => ({ ...f, reason: r }))}
                disabled={isReadOnly}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }
  return null;
};

export default TimeEntryFields;