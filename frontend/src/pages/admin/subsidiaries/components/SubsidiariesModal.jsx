const SubsidiariesModal = ({
  modalMode,
  formSub,
  setFormSub,
  onClose,
  onSave,
  staffs,
}) => (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
    <div className="bg-white z-50 p-6 space-y-4 rounded-lg shadow-lg w-full max-w-md border border-solid border-gray-200">
      <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
        <span>{modalMode === "add" ? "Add Subsidiary" : "Edit Subsidiary"}</span>
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block mb-1 font-medium">Subsidiary Name</label>
          <input
            className="w-full p-2 border rounded-lg text-sm focus:ring-primary focus:outline-blue-500 outline outline-2 outline-transparent"
            value={formSub.name}
            onChange={(e) => setFormSub((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter subsidiary name"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Subsidiary Head</label>
          <select
            className="w-full p-2 border rounded-lg text-sm focus:ring-primary focus:outline-blue-500 outline outline-2 outline-transparent"
            value={formSub.manager_id}
            onChange={(e) =>
              setFormSub((prev) => ({
                ...prev,
                manager_id: e.target.value,
              }))
            }
            required
          >
            <option value="" disabled>Select subsidiary head</option>
            {staffs
              .filter((u) => (u.role_id === 2 || u.role_id === 3) && u.is_active === "yes")
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

export default SubsidiariesModal;
