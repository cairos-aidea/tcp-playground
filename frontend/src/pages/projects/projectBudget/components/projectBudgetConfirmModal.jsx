import React, { useState } from "react";
import ReactLoading from "react-loading";
import { ArrowBigRightDash, ChevronsRight, Lock } from "lucide-react";

const ProjectBudgetConfirmModal = ({
  isVisible,
  setModalVisible,
  handleSave,
  projectVersion,
  projectId,
  projectName,
  projectCode,
}) => {
  const [loading, setLoading] = useState(false);

  const onArchive = async () => {
    setLoading(true);
    try {
      await handleSave(projectId);
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md p-6">
        {/* Title */}
        <h3 className="text-xl font-semibold text-center text-gray-800 mb-4">
          Lock Project Budget Version
        </h3>

        {/* Info Text */}
        <p className="text-sm text-gray-600 text-center mb-4">
          You are about to confirm and lock a new budget version for this
          project.
        </p>

        {/* Details */}
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex flex-col items-center mb-2">
            <div className="flex items-center gap-4">
              {/* Locked Version Circle */}
              <div className="flex flex-col items-center">
                <div className="relative w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white border border-blue-700 shadow-md">
                  {projectVersion}
                  {/* Lock Icon Overlay */}
                  <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow">
                    <Lock className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <span className="text-xs text-blue-600 mt-2 font-semibold">
                  Version Locked
                </span>
                <span className="text-[10px] text-gray-500 mt-1">
                  This version can no longer be edited
                </span>
              </div>
            </div>
            {/* <span className="text-xs text-gray-500 mt-2">
              Archiving will create version {projectVersion} from version{" "}
              {Number(projectVersion) - 1}.
            </span> */}
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-500">Project Code:</span>
            <span className="font-semibold text-gray-900">{projectCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-500">Project Name:</span>
            <span className="font-semibold text-gray-900">{projectName}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3 mt-6">
          <button
            type="button"
            className="px-10 py-2.5 rounded-full bg-primary text-white text-sm font-medium shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition flex items-center justify-center"
            onClick={onArchive}
            disabled={loading}
          >
            {loading ? (
              <ReactLoading type="bars" color="#fff" height={20} width={20} />
            ) : (
              "Lock"
            )}
          </button>
          <button
            type="button"
            className="px-6 py-2.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium shadow hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 transition"
            onClick={() => setModalVisible(false)}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectBudgetConfirmModal;
