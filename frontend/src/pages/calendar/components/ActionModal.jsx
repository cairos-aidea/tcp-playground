import React from "react";

/* ActionModal style references (Tailwind CSS classes):

Modal Overlay:
- fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-40

Modal Container:
- bg-white rounded-lg shadow-lg w-full max-w-6xl relative

Close Button:
- absolute top-4 right-4 text-gray-400 hover:text-gray-600

Icon Container:
- mb-4 flex justify-center
- bg-primary p-3 rounded-aidea-sm

Title:
- text-lg font-medium text-gray-900 mb-3

Message:
- text-gray-600 mb-6

Action Buttons:
- text-sm px-8 py-3 text-white rounded-full bg-green-500 hover:bg-green-600
- text-sm px-8 py-3 text-white rounded-full bg-red-500 hover:bg-red-600
- text-sm px-8 py-3 text-white rounded-full bg-yellow-500 hover:bg-yellow-600
- text-sm px-4 py-3 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400

Button Group:
- p-4 flex justify-center gap-3

*/

const ActionModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "Do you want to proceed with this action?",
    confirmText = "Yes",
    cancelText = "No",
    confirmColor = "bg-green-500 hover:bg-green-600",
    icon = null,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-40">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl relative">
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    onClick={onClose}
                    aria-label="Close"
                >
                    &times;
                </button>
                {icon && (
                    <div className="mb-4 flex justify-center bg-primary p-3 rounded-aidea-sm">
                        {icon}
                    </div>
                )}
                <div className="p-8">
                    <div className="text-lg font-medium text-gray-900 mb-3">{title}</div>
                    <div className="text-gray-600 mb-6">{message}</div>
                    <div className="p-4 flex justify-center gap-3">
                        <button
                            className={`text-sm px-8 py-3 text-white rounded-full ${confirmColor}`}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </button>
                        <button
                            className="text-sm px-4 py-3 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400"
                            onClick={onClose}
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActionModal;