import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';

const headerReq = { token: localStorage.getItem("auth_accessToken") };

export const useProjects = () => {
    return useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            return await api("projects", headerReq, null);
        },
        staleTime: 1000 * 60 * 30, // 30 mins
    });
};

export const useStaffs = () => {
    return useQuery({
        queryKey: ['staffs'],
        queryFn: async () => {
            return await api("staffs_list", headerReq, null);
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};

export const useDepartments = () => {
    return useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            // Note: API endpoint might differ, checking context usage
            return await api("departments_list", headerReq, null);
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};

export const useProjectStages = () => {
    return useQuery({
        queryKey: ['projectStages'],
        queryFn: async () => {
            return await api("project_stages", headerReq, null);
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};

export const useProjectsInternal = () => {
    return useQuery({
        queryKey: ['projectsInternal'],
        queryFn: async () => {
            return await api("project_internals", headerReq, null);
        },
        staleTime: 1000 * 60 * 30,
    });
};

export const useDepartmentalTasks = () => {
    return useQuery({
        queryKey: ['departmentalTasks'],
        queryFn: async () => {
            return await api("departmental_tasks", headerReq, null);
        },
        staleTime: 1000 * 60 * 30,
    });
};
