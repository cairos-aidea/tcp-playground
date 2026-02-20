import { toast } from "sonner";

export function successNotification({ title, message }) {
    toast.success(title || "Success", {
        description: message,
    });
}

export function errorNotification({ id, title, message }) {
    toast.error(title || "Error", {
        description: message,
    });
}

export function pendingNotification({ id, title, message }) {
    toast.warning(title || "Pending", {
        description: message,
    });
}

export function promiseNotification(promise, { loadingText, successTitle, successText, errorTitle, errorText }) {
    return toast.promise(promise, {
        loading: loadingText || 'Loading...',
        success: (data) => {
             // Can be customized based on data returned from the promise
             return successText || 'Operation completed successfully';
        },
        error: (err) => {
             return errorText || err?.message || 'Something went wrong';
        },
    });
}