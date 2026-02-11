const DepartmentalTasksModal = ({
  formState,
  setFormState,
  handleModalOk,
  setModalVisible,
  editingTask,
  departments,
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="bg-white z-50 p-6 space-y-4 rounded-lg shadow-lg w-full max-w-md border border-solid border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
          <span>{editingTask ? "Edit Task" : "Add Task"}</span>
        </h3>
        <form onSubmit={handleModalOk} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Task Name</label>
            <input
              className="w-full p-2 border rounded-lg text-sm focus:ring-primary focus:outline-blue-500 outline outline-2 outline-transparent"
              name="task_name"
              value={formState.task_name}
              onChange={handleInputChange}
              required
              placeholder="Enter task name"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Department</label>
            <select
              className="w-full p-2 border rounded-lg text-sm focus:ring-primary focus:outline-blue-500 outline outline-2 outline-transparent"
              name="department_id"
              value={formState.department_id}
              onChange={handleInputChange}
              required
            >
              <option value="" disabled>Select task</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="text-sm px-6 py-3 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 focus:ring-primary"
              onClick={() => setModalVisible(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-sm px-6 py-3 bg-primary text-white rounded-full hover:bg-primary-hover focus:ring-primary"
            >
              {editingTask ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentalTasksModal;
