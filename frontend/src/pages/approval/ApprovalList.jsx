import React, { useState, useEffect, useMemo } from 'react';
import { PageContainer } from "@/components/ui/PageContainer";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Check, X, Filter, RefreshCw, CircleCheck } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useApprovals, useApprovalActions } from '../../hooks/useApprovals';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FilterSidebar from './components/FilterSidebar'; // Reuse or refactor this later

// Helper for formatting date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

// Helper for formatting time (HH:MM -> 12h AM/PM)
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  // Expecting "HH:MM" or "HH:MM:SS"
  const [hour, minute] = timeStr.split(':');
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
};

const ApprovalList = () => {
  const {
    // Filter data dependencies...
    projects, projectStages, staffs, departments, auth_user
  } = useAppData();

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filter, setFilter] = useState({
    is_ot: false, start_date: null, end_date: null,
    project_id: null, stage_id: null, staff_id: null, status: null
  });
  const [search, setSearch] = useState("");
  const [selectedRemark, setSelectedRemark] = useState(null);

  // React Query Hooks
  const { data: timeCharges, isLoading, isFetching, refetch } = useApprovals(page, filter, itemsPerPage);
  const { mutate: performAction } = useApprovalActions();

  // Handle Actions
  const handleAction = (action, ids) => {
    if (!ids.length) return;
    performAction(
      { action, ids },
      {
        onSuccess: () => {
          setSelectedIds([]);
        },
        onError: (error) => {
          console.error("Action failed:", error);
        }
      }
    );
  };

  const filteredTimeCharges = useMemo(() => {
    const data = timeCharges?.data || [];
    if (!search) return data;
    const lower = search.toLowerCase();
    return data.filter(item => {
      const projectCode = item.project_code?.toLowerCase() || "";
      const projectLabel = item.project_label?.toLowerCase() || "";
      const userName = (item.user?.first_name + " " + item.user?.last_name)?.toLowerCase() || "";
      const stageLabel = item.stage_label?.toLowerCase() || "";

      return (
        projectCode.includes(lower) ||
        projectLabel.includes(lower) ||
        userName.includes(lower) ||
        stageLabel.includes(lower)
      );
    });
  }, [timeCharges?.data, search]);

  const columns = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "time_charge_date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.time_charge_date)
    },
    {
      id: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const user = row.original.user;
        if (!user) return "-";
        return (
          <div className="flex flex-col">
            <span className="font-medium">{user.first_name} {user.last_name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        );
      }
    },
    {
      id: "project",
      header: "Project",
      cell: ({ row }) => {
        const { project_code, project_label } = row.original;
        return (
          <div className="flex flex-col max-w-[200px]">
            {project_code && <span className="font-medium">{project_code}</span>}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate cursor-default">{project_label}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{project_label}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        );
      }
    },
    {
      accessorKey: "stage_label",
      header: "Stage",
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm text-muted-foreground truncate block max-w-[150px] cursor-default">
              {row.original.stage_label || '-'}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{row.original.stage_label || '-'}</p>
          </TooltipContent>
        </Tooltip>
      )
    },
    {
      accessorKey: "activity",
      header: "Activity",
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm truncate block max-w-[150px] cursor-default">
              {row.original.activity || '-'}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{row.original.activity || '-'}</p>
          </TooltipContent>
        </Tooltip>
      )
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => {
        const hrs = Number(row.original.duration_hrs || 0);
        const mins = Number(row.original.duration_min || 0);
        const startTime = row.original.start_time;
        const endTime = row.original.end_time;

        return (
          <div className="flex flex-col items-start gap-1">
            <Badge variant="secondary" className="font-mono text-xs font-normal">
              {(hrs + mins / 60).toFixed(2)}h
            </Badge>
            {(startTime && endTime) && (
              <span className="text-[10px] text-muted-foreground">
                {formatTime(startTime)} - {formatTime(endTime)}
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "is_ot",
      header: "OT",
      cell: ({ row }) => row.original.is_ot ? (
        <div className="flex justify-center">
          <CircleCheck className="h-4 w-4 text-gray-500" />
        </div>
      ) : null,
      enableSorting: true,
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="max-w-[200px] truncate text-xs text-muted-foreground cursor-pointer hover:underline hover:text-foreground transition-colors"
              onClick={() => setSelectedRemark({
                content: row.original.remarks,
                type: 'Remarks',
                user: row.original.user
              })}
            >
              {row.original.remarks || '-'}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px] break-words">
            <p>{row.original.remarks || '-'}</p>
          </TooltipContent>
        </Tooltip>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || 'pending';
        const colors = {
          approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
          pending: "bg-amber-100 text-amber-800 border-amber-200",
          declined: "bg-rose-100 text-rose-800 border-rose-200"
        };
        return <Badge variant="outline" className={colors[status]}>{status}</Badge>
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={() => handleAction('approve', [row.original.id])}
              >
                <Check size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Approve</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={() => handleAction('decline', [row.original.id])}
              >
                <X size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Decline</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                onClick={() => handleAction('reopen', [row.original.id])}
              >
                <RefreshCw size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reopen</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    }
  ], []);

  // Filter handlers
  const resetFilter = () => setFilter({});
  const applyFilter = () => fetchApproversList(1, filter, itemsPerPage);

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Approvals</h2>
          <p className="text-muted-foreground">Review and approve time charges.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction('approve', selectedIds)}>
                Approve ({selectedIds.length})
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleAction('decline', selectedIds)}>
                Decline ({selectedIds.length})
              </Button>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => handleAction('reopen', selectedIds)}>
                Reopen ({selectedIds.length})
              </Button>
            </div>
          )}
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Requests</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                {/* Reuse FilterSidebar logic or components here via generic children or direct reuse if compatible */}
                <FilterSidebar
                  projects={projects}
                  projectStages={projectStages}
                  staffs={staffs}
                  filter={filter}
                  setFilter={setFilter}
                  applyFilter={applyFilter}
                  resetFilter={resetFilter}
                  auth_user={auth_user}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center max-w-sm">
          <Input
            placeholder="Search approvals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[300px]"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredTimeCharges}
          loading={isLoading}
          onRowSelectionChange={(rows) => setSelectedIds(rows.map(r => r.original.id))}
        />
      </div>
      {/* Pagination Control needed if DataTable doesn't handle server-side paging built-in 
            For now assuming DataTable handles local or we add a footer pagination 
        */}

      {/* Remarks Dialog */}
      <Dialog open={!!selectedRemark} onOpenChange={(open) => !open && setSelectedRemark(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remarks</DialogTitle>
            <DialogDescription>
              From {selectedRemark?.user?.first_name} {selectedRemark?.user?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {selectedRemark?.content || "No remarks provided."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRemark(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default ApprovalList;