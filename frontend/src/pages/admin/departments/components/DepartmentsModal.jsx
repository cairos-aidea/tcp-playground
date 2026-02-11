const DepartmentsModal = ({
  modalMode,
  formDept,
  setFormDept,
  onClose,
  onSave,
  subsidiaries,
  staffs,
}) => (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
    <div className="bg-white z-50 p-6 space-y-4 rounded-lg shadow-lg w-full max-w-md border border-solid border-gray-200">
      <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
        <span>{modalMode === "add" ? "Add Department" : "Edit Department"}</span>
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block mb-1 font-medium">Department Name</label>
          <input
            className="w-full p-2 border rounded-lg text-sm focus:ring-primary focus:outline-blue-500 outline outline-2 outline-transparent"
            value={formDept.name}
            onChange={(e) => setFormDept((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter department name"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Subsidiary</label>
          <select
            className="w-full p-2 border rounded-lg text-sm focus:ring-primary focus:outline-blue-500 outline outline-2 outline-transparent"
            value={formDept.subsidiary_id}
            onChange={(e) =>
              setFormDept((prev) => ({
                ...prev,
                subsidiary_id: e.target.value,
                department_head_id: "",
              }))
            }
            required
          >
            <option value="" disabled>Select subsidiary</option>
            {subsidiaries.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Department Head</label>
          <select
            className="w-full p-2 border rounded-lg text-sm focus:ring-primary focus:outline-blue-500 outline outline-2 outline-transparent"
            value={formDept.department_head_id}
            onChange={(e) =>
              setFormDept((prev) => ({
                ...prev,
                department_head_id: e.target.value,
              }))
            }
            disabled={!formDept.subsidiary_id}
            required
          >
            <option value="" disabled>Select department head</option>
            {staffs
              .filter(
                (u) =>
                  String(u.subsidiary_id) === String(formDept.subsidiary_id) &&
                  (u.role_id === 2 || u.role_id === 3) && 
                  (u.is_active === "yes")
              )
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name}
                </option>
              ))}
          </select>
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

export default DepartmentsModal;