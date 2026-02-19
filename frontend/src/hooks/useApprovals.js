import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';

const headerReq = { token: localStorage.getItem("auth_accessToken") };

export const useApprovals = (page = 1, filter = null, perPage = 25) => {
    return useQuery({
        queryKey: ['approvals', page, filter, perPage],
        queryFn: async () => {
            const headerParams = { ...headerReq, page, per_page: perPage };
            const result = await api("approvers_list", headerParams, filter);
            return result;
        },
        keepPreviousData: true, // Keep showing old data while fetching new page
    });
};

export const useApprovalActions = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ action, ids }) => {
            if (!ids.length) return;
            return await api(action, headerReq, { time_charge_ids: ids });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
        },
    });
};
