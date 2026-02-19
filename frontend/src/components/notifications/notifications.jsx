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