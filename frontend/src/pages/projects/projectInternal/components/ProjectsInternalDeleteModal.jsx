import React from "react";

const ProjectsInternalDeleteModal = ({ isVisible, setModalVisible, handleDelete, projectId }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="bg-white z-50 p-6 space-y-4 rounded-lg shadow-lg w-full max-w-md border border-solid border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-center">Delete Project</h3>
        <p className="text-center text-sm mb-6">
          Are you sure you want to delete this project? This action cannot be undone.
        </p>

        <div className="flex justify-center gap-4">
          <button
            type="button"
            className="text-sm px-6 py-3 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 focus:ring-primary"
            onClick={() => setModalVisible(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="text-sm px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 focus:ring-primary"
            onClick={() => {
              handleDelete(projectId);
              setModalVisible(false);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectsInternalDeleteModal;
