import { ArrowUpDown, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS = {
    1: "Employee",
    2: "Manager",
    3: "Admin",
};

const STATUS_Styles = {
    "Regular": "default",
    "Probationary": "secondary",
    "Contractual": "outline"
}

export const columns = (onEdit, onDelete) => [
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    User
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const user = row.original;
            const initials = `${user?.first_name?.[0]?.toUpperCase() || ''}${user?.last_name?.[0]?.toUpperCase() || ''}`;
            return (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold">
                        {user.profile ? (
                            <img src={`data:image/png;base64,${user.profile}`} alt={user.name} className="h-full w-full rounded-full object-cover" />
                        ) : (
                            initials
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                </div>
            )
        }
    },
    {
        accessorKey: "role_id",
        header: "Role",
        cell: ({ row }) => {
            const roleId = row.getValue("role_id");
            return (
                <Badge variant="outline" className="font-normal">
                    {ROLE_LABELS[roleId] || "Unknown"}
                </Badge>
            );
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status");
            return <Badge variant={STATUS_Styles[status] || "secondary"} className="font-normal">{status}</Badge>
        }
    },
    {
        accessorKey: "sex",
        header: "Sex",
        cell: ({ row }) => <span className="uppercase text-xs font-medium text-muted-foreground">{row.getValue("sex")}</span>
    },
    {
        accessorKey: "employee_id",
        header: "ID",
        cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("employee_id")}</span>
    },
    {
        accessorKey: "rank",
        header: "Rank",
    },
    {
        accessorKey: "subsidiary_name", // We will preprocess data to have this
        header: "Subsidiary",
    },
    {
        accessorKey: "department_name", // We will preprocess data to have this
        header: "Department",
    },
    {
        accessorKey: "hire_date",
        header: "Hire Date",
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.getValue("hire_date")}</span>
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const user = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* <DropdownMenuItem className="text-destructive" onClick={() => onDelete(user)}>
               <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem> */}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
