import { Navigate } from "react-router-dom";

/**
 * Redirects to /dashboard if the user is not authorized.
 * @param {Object} user - The user object.
 * @param {number[]} allowedRoles - Array of allowed role IDs.
 */
/**
 * Checks if the user is an admin (role_id 3).
 * @param {Object} user
 * @returns {boolean|JSX.Element}
 */
export function authorizeAdmin(user) {
    if (!user || user.role_id !== 3) {
        return <Navigate to="/dashboard" replace />;
    }
    return true;
}

/**
 * Checks if the user is a manager (role_id 2) or admin (role_id 3).
 * @param {Object} user
 * @returns {boolean|JSX.Element}
 */
export function authorizeManage(user) {
    if (!user || ![2, 3].includes(user.role_id)) {
        return <Navigate to="/dashboard" replace />;
    }
    return true;
}