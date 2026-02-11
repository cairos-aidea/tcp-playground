import React, { useEffect } from "react";

const HolidaysModal = ({
  show,
  onClose,
  onSave,
  formHoliday,
  setFormHoliday,
  modalMode
}) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormHoliday((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="bg-white z-50 p-6 space-y-4 rounded-lg shadow-lg w-full max-w-md border border-solid border-gray-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
          <span>{modalMode === "add" ? "Add Holiday" : "Edit Holiday"}</span>
        </h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSave();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block mb-1 font-medium">Title</label>
            <input
              type="text"
              name="holiday_title"
              value={formHoliday.holiday_title}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg text-sm focus:ring-primary focus:outline-blue-500 outline outline-2 outline-transparent"
              placeholder="Enter holiday title"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Type</label>
            <select
              name="holiday_type"
              value={formHoliday.holiday_type}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg text-sm focus:ring-primary focus:outline-blue-500 outline outline-2 outline-transparent"
              required
            >
              <option value="" disabled>Select type</option>
              <option value="regular">Regular Holiday</option>
              <option value="special">Special Holiday</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Date</label>
            <input
              type="date"
              name="date"
              value={
                formHoliday.isFixedDate
                  ? `${new Date().getFullYear()}-${formHoliday.date.slice(-5)}`
                  : formHoliday.date
              }
              onChange={handleChange}
              className="w-full p-2 border rounded-lg text-sm focus:ring-primary focus:outline-blue-500 outline outline-2 outline-transparent"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isFixedDate"
              checked={formHoliday.isFixedDate}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="font-medium">Is Fixed Date?</label>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="text-sm px-6 py-3 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 focus:ring-primary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-sm px-6 py-3 bg-primary text-white rounded-full hover:bg-primary-hover focus:ring-primary"
            >
              {modalMode === "add" ? "Add" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HolidaysModal;
