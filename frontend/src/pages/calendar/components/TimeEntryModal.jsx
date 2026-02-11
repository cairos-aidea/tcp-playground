import React from "react";
import { Plus, X, Clock } from "lucide-react";
import { Bars } from "react-loader-spinner";

const TimeEntryModal = ({
  modalOpen,
  setModalOpen,
  slotInfo,
  tab,
  setTab,
  form,
  setForm,
  activityOptions,
  setActivityOptions,
  error,
  loading,
  handleFormChange,
  handleSubmit,
  handleDeleteEvent,
  renderFields,
  isReadOnly,
  approverName,
}) => (
  <div
    className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity ${modalOpen ? "" : "hidden"}`}
    tabIndex="-1"
    aria-modal="true"
    role="dialog"
  >
    <div className="relative w-full max-w-xl bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <Plus className="w-5 h-5" />
        <span className="font-semibold text-lg">{slotInfo?.isEdit ? "Edit Entry" : "Add Entry"}</span>
        <button
          type="button"
          className="ml-auto text-gray-400 hover:text-gray-900"
          onClick={() => setModalOpen(false)}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {/* Tabs */}
      <div className="flex border-b px-6 pt-2 gap-2">
        <button
          className={`px-3 py-1 rounded-t ${tab === "time_charge" ? "bg-blue-100 font-semibold" : "bg-gray-100"}`}
          onClick={() => setTab("time_charge")}
          type="button"
          disabled={isReadOnly}
        >
          Time Charge
        </button>
        <button
          className={`px-3 py-1 rounded-t ${tab === "leaves" ? "bg-blue-100 font-semibold" : "bg-gray-100"}`}
          onClick={() => setTab("leaves")}
          type="button"
          disabled={isReadOnly}
        >
          Leaves
        </button>
        <button
          className={`px-3 py-1 rounded-t ${tab === "official_business" ? "bg-blue-100 font-semibold" : "bg-gray-100"}`}
          onClick={() => setTab("official_business")}
          type="button"
          disabled={isReadOnly}
        >
          Official Business
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-4">
          {renderFields()}
          {isReadOnly && (
            <div className="text-green-700 text-sm mb-2">
              <span>
                This entry has been <b>{form.data.status}</b>
                {approverName && (
                  <> by <b>{approverName}</b></>
                )}
                .
              </span>
            </div>
          )}
          {error && (
            <div className="text-red-600 text-sm mb-2 flex items-center gap-1">
              <X className="w-4 h-4" /> {error}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          {loading ? (
            <div className="w-full flex flex-col items-center">
              <Bars
                height="80"
                width="80"
                color="#251D5C"
                ariaLabel="bars-loading"
                wrapperStyle={{}}
                wrapperClass="bar-loader"
                visible={true}
              />
            </div>
          ) : (
            <>
              {slotInfo?.isEdit && !isReadOnly && (
                <button
                  type="button"
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                  onClick={handleDeleteEvent}
                >
                  Delete
                </button>
              )}
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                disabled={isReadOnly}
              >
                Submit
              </button>
              <button
                type="button"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  </div>
);

export default TimeEntryModal;
