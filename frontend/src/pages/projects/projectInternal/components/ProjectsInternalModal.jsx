import React from "react";

const ProjectsInternalModal = ({
  editingProject,
  formState,
  setFormState,
  handleModalOk,
  handleInputChange,
  setModalVisible,
  subsidiaries,
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="bg-white z-50 p-6 space-y-4 rounded-lg shadow-lg w-full max-w-md border border-solid border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
          <span>{editingProject ? "Edit Project" : "Add Project"}</span>
        </h3>
        <form onSubmit={handleModalOk} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Project Code</label>
            <input
              className="w-full p-2 border rounded-lg text-sm focus:ring-primary focus:outline-blue-500 outline outline-2 outline-transparent"
              name="project_code"
              value={formState.project_code}
              onChange={handleInputChange}
              required
              placeholder="Enter project code"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Project Name</label>
            <input
              className="w-full p-2 border rounded-lg text-sm focus:ring-primary focus:outline-blue-500 outline outline-2 outline-transparent"
              name="project_name"
              value={formState.project_name}
              onChange={handleInputChange}
              required
              placeholder="Enter project name"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Subsidiary</label>
            <select
              className="w-full p-2 border rounded-lg text-sm focus:ring-primary focus:outline-blue-500 outline outline-2 outline-transparent"
              name="subsidiary_id"
              value={formState.subsidiary_id}
              onChange={handleInputChange}
              required
            >
              <option value="" disabled>Select subsidiary</option>
              {subsidiaries?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Status</label>
            <select
              className="w-full p-2 border rounded-lg text-sm focus:ring-primary focus:outline-blue-500 outline outline-2 outline-transparent"
              name="project_status"
              value={formState.project_status}
              onChange={handleInputChange}
              required
            >
              <option value="" disabled>Select status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="other">Other</option>
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
              {editingProject ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectsInternalModal;
